"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMap, useYDoc } from "@y-sweet/react";
import { hashPin } from "@/lib/crypto";
import * as Y from 'yjs';

// Constantes de versão
const AUTO_VERSION_PREFIX = '[Auto] ';
const MAX_AUTO_VERSIONS = 10;
const AUTO_SAVE_INTERVAL = 60000; // 1 minuto

interface DocumentVersion {
    id: string;
    documentId: string;
    subdocumentName?: string;
    timestamp: number;
    label?: string;
    size: number;
    createdBy?: string;
}

interface DocumentSettingsProps {
    documentId: string;
    subdocumentName?: string;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'versions' | 'security' | 'danger';

export function DocumentSettings({ documentId, subdocumentName, isOpen, onClose }: DocumentSettingsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('versions');

    // PIN states
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isProtected, setIsProtected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">();
    const [showPassword, setShowPassword] = useState(false);
    const securityMap = useMap("security");

    // Version states
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [savingVersion, setSavingVersion] = useState(false);
    const [restoringVersion, setRestoringVersion] = useState<string | null>(null);
    const [newVersionLabel, setNewVersionLabel] = useState('');
    const lastAutoSaveRef = useRef<string | null>(null);

    const doc = useYDoc();

    // Load settings from Y-Sweet
    useEffect(() => {
        if (!isOpen || !securityMap) return;

        try {
            const isProtected = securityMap.get("protected") === true;
            setIsProtected(isProtected);
        } catch (error) {
            console.error("Error loading settings:", error);
            setIsProtected(false);
        }

        setPin("");
        setConfirmPin("");
    }, [isOpen, securityMap]);

    // Fetch versions
    const fetchVersions = useCallback(async () => {
        setLoadingVersions(true);
        try {
            const params = new URLSearchParams();
            if (subdocumentName) {
                params.set('subdocument', subdocumentName);
            }

            const response = await fetch(
                `/api/documents/${documentId}/versions?${params.toString()}`
            );

            if (response.ok) {
                const data = await response.json();
                setVersions(data.versions || []);
            }
        } catch (error) {
            console.error('Error fetching versions:', error);
            showMessage('Erro ao carregar versões', 'error');
        } finally {
            setLoadingVersions(false);
        }
    }, [documentId, subdocumentName]);

    // Load versions when opening and on versions tab
    useEffect(() => {
        if (isOpen && activeTab === 'versions') {
            fetchVersions();
        }
    }, [isOpen, activeTab, fetchVersions]);

    // Auto-save functionality
    const createAutoVersion = useCallback(async () => {
        if (!doc) return;

        try {
            const params = new URLSearchParams();
            if (subdocumentName) {
                params.set('subdocument', subdocumentName);
            }

            const listResponse = await fetch(
                `/api/documents/${documentId}/versions?${params.toString()}`
            );

            if (!listResponse.ok) return;

            const data = await listResponse.json();
            const allVersions: DocumentVersion[] = data.versions || [];
            const autoVersions = allVersions.filter(v => v.label?.startsWith(AUTO_VERSION_PREFIX));

            if (autoVersions.length >= MAX_AUTO_VERSIONS) {
                const oldestAuto = autoVersions.sort((a, b) => a.timestamp - b.timestamp)[0];
                if (oldestAuto) {
                    await fetch(
                        `/api/documents/${documentId}/versions/${oldestAuto.id}`,
                        { method: 'DELETE' }
                    );
                }
            }

            const update = Y.encodeStateAsUpdate(doc);
            const currentHash = Array.from(new Uint8Array(update.slice(0, 100)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            if (lastAutoSaveRef.current === currentHash) {
                return;
            }

            const formData = new FormData();
            formData.append('update', new Blob([new Uint8Array(update).buffer], { type: 'application/octet-stream' }));
            formData.append('label', `${AUTO_VERSION_PREFIX}${new Date().toLocaleTimeString('pt-BR')}`);
            if (subdocumentName) {
                formData.append('subdocument', subdocumentName);
            }

            const response = await fetch(`/api/documents/${documentId}/versions`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                lastAutoSaveRef.current = currentHash;
                console.log('Auto-save realizado com sucesso');
            }
        } catch (error) {
            console.error('Erro no auto-save:', error);
        }
    }, [doc, documentId, subdocumentName]);

    // Timer para auto-save
    useEffect(() => {
        const intervalId = setInterval(() => {
            createAutoVersion();
        }, AUTO_SAVE_INTERVAL);

        return () => clearInterval(intervalId);
    }, [createAutoVersion]);

    const showMessage = (msg: string, type: "success" | "error") => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 3000);
    };

    // Version handlers
    const createVersion = async () => {
        if (!doc) {
            showMessage('Documento não está conectado', 'error');
            return;
        }

        setSavingVersion(true);
        try {
            const update = Y.encodeStateAsUpdate(doc);
            const formData = new FormData();
            formData.append('update', new Blob([new Uint8Array(update).buffer], { type: 'application/octet-stream' }));
            if (newVersionLabel) {
                formData.append('label', newVersionLabel);
            }
            if (subdocumentName) {
                formData.append('subdocument', subdocumentName);
            }

            const response = await fetch(`/api/documents/${documentId}/versions`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showMessage('Versão salva com sucesso!', 'success');
                setNewVersionLabel('');
                fetchVersions();
            } else {
                throw new Error('Failed to save version');
            }
        } catch (error) {
            console.error('Error creating version:', error);
            showMessage('Erro ao salvar versão', 'error');
        } finally {
            setSavingVersion(false);
        }
    };

    const restoreVersion = async (versionId: string) => {
        if (!doc) {
            showMessage('Documento não está conectado', 'error');
            return;
        }

        const confirmed = window.confirm(
            'Tem certeza que deseja restaurar esta versão? O conteúdo atual será substituído.'
        );

        if (!confirmed) return;

        setRestoringVersion(versionId);
        try {
            // Save current state as backup
            const currentUpdate = Y.encodeStateAsUpdate(doc);
            const backupFormData = new FormData();
            backupFormData.append('update', new Blob([new Uint8Array(currentUpdate).buffer], { type: 'application/octet-stream' }));
            backupFormData.append('label', 'Backup antes de restaurar');
            if (subdocumentName) {
                backupFormData.append('subdocument', subdocumentName);
            }

            await fetch(`/api/documents/${documentId}/versions`, {
                method: 'POST',
                body: backupFormData,
            });

            // Fetch the version to restore
            const response = await fetch(
                `/api/documents/${documentId}/versions/${versionId}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch version data');
            }

            const updateBuffer = await response.arrayBuffer();
            const update = new Uint8Array(updateBuffer);

            const textKey = subdocumentName
                ? `text:${subdocumentName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")}`
                : 'text';

            const tempDoc = new Y.Doc();
            Y.applyUpdate(tempDoc, update);

            const restoredYText = tempDoc.getText(textKey);
            const deltas = restoredYText.toDelta();

            doc.transact(() => {
                const yText = doc.getText(textKey);
                yText.delete(0, yText.length);
                let index = 0;
                for (const delta of deltas) {
                    if (delta.insert) {
                        const text = typeof delta.insert === 'string' ? delta.insert : '';
                        if (delta.attributes) {
                            yText.insert(index, text, delta.attributes);
                        } else {
                            yText.insert(index, text);
                        }
                        index += text.length;
                    }
                }
            });

            tempDoc.destroy();

            showMessage('Versão restaurada com sucesso!', 'success');
            fetchVersions();
        } catch (error) {
            console.error('Error restoring version:', error);
            showMessage('Erro ao restaurar versão', 'error');
        } finally {
            setRestoringVersion(null);
        }
    };

    const deleteVersion = async (versionId: string) => {
        const confirmed = window.confirm('Tem certeza que deseja excluir esta versão?');
        if (!confirmed) return;

        try {
            const response = await fetch(
                `/api/documents/${documentId}/versions/${versionId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                showMessage('Versão excluída', 'success');
                fetchVersions();
            } else {
                throw new Error('Failed to delete version');
            }
        } catch (error) {
            console.error('Error deleting version:', error);
            showMessage('Erro ao excluir versão', 'error');
        }
    };

    // PIN handlers
    const handleSavePin = async () => {
        if (!pin.trim()) {
            showMessage("Digite um PIN", "error");
            return;
        }

        if (pin.length < 4) {
            showMessage("PIN deve ter pelo menos 4 dígitos", "error");
            return;
        }

        if (pin !== confirmPin) {
            showMessage("Os PINs não correspondem", "error");
            return;
        }

        if (!securityMap) {
            showMessage("Erro ao conectar com Y-Sweet", "error");
            return;
        }

        setIsLoading(true);

        try {
            console.log("[DocumentSettings] Gerando hash para novo PIN");
            const pinHash = await hashPin(pin);
            console.log("[DocumentSettings] Hash gerado, salvando no documento...");

            securityMap.set("protected", true);
            securityMap.set("passwordHash", pinHash);
            securityMap.set("createdAt", new Date().toISOString());

            console.log("[DocumentSettings] PIN salvo com sucesso!");
            setIsProtected(true);
            setPin("");
            setConfirmPin("");
            showMessage("PIN configurado com sucesso! ✓", "success");
        } catch (error) {
            console.error("[DocumentSettings] Erro ao salvar PIN:", error);
            showMessage("Erro ao salvar PIN", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePin = async () => {
        if (!isProtected) return;

        if (!securityMap) {
            showMessage("Erro ao conectar com Y-Sweet", "error");
            return;
        }

        setIsLoading(true);

        try {
            securityMap.set("protected", false);
            securityMap.delete("passwordHash");

            setIsProtected(false);
            setPin("");
            setConfirmPin("");
            showMessage("PIN removido com sucesso", "success");
        } catch (error) {
            console.error("Failed to remove PIN:", error);
            showMessage("Erro ao remover PIN", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDocument = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
                method: "DELETE",
            });

            if (response.ok) {
                showMessage("Nota deletada. Redirecionando...", "success");
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                showMessage("Erro ao deletar nota", "error");
            }
        } catch (error) {
            console.error("Failed to delete document:", error);
            showMessage("Erro ao deletar nota", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper functions
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'agora mesmo';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} h atrás`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} dias atrás`;
        return formatDate(timestamp);
    };

    if (!isOpen) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        {
            id: 'versions',
            label: 'Versões',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            ),
        },
        {
            id: 'security',
            label: 'Segurança',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
            ),
        },
        {
            id: 'danger',
            label: 'Perigo',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
                role="presentation"
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Configurações da Nota
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-500 dark:text-slate-400"
                        aria-label="Fechar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200/50 dark:border-slate-700/50 px-6">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                    ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
                    <div className="px-6 py-6 space-y-6">
                        {/* Message */}
                        {message && (
                            <div
                                className={`p-3 rounded-lg text-sm font-medium transition ${messageType === "success"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-800/50"
                                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/50"
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        {/* Versions Tab */}
                        {activeTab === 'versions' && (
                            <div className="space-y-4">
                                {/* Create Version */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newVersionLabel}
                                        onChange={(e) => setNewVersionLabel(e.target.value)}
                                        placeholder="Nome da versão (opcional)"
                                        className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition"
                                    />
                                    <button
                                        onClick={createVersion}
                                        disabled={savingVersion || !doc}
                                        className="px-4 py-2.5 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                                    >
                                        {savingVersion ? '...' : '💾 Salvar'}
                                    </button>
                                </div>

                                {/* Info */}
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    💡 Auto-save a cada 1 minuto (máx. 10 versões automáticas).
                                </p>

                                {/* Versions List */}
                                {loadingVersions ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin" />
                                    </div>
                                ) : versions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600 dark:text-slate-400">Nenhuma versão salva ainda.</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Clique em "Salvar" para criar um ponto de restauração.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {versions.map((version) => {
                                            const isAutoVersion = version.label?.startsWith(AUTO_VERSION_PREFIX);
                                            return (
                                                <div
                                                    key={version.id}
                                                    className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 transition"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                                                    {version.label || 'Versão sem nome'}
                                                                </span>
                                                                {isAutoVersion && (
                                                                    <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                                                                        AUTO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                {getRelativeTime(version.timestamp)} • {formatBytes(version.size)}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5 shrink-0">
                                                            <button
                                                                onClick={() => restoreVersion(version.id)}
                                                                disabled={restoringVersion === version.id}
                                                                className="px-2.5 py-1 text-xs font-medium rounded-md transition disabled:opacity-50 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                                                title="Restaurar esta versão"
                                                            >
                                                                {restoringVersion === version.id ? '...' : '↩️'}
                                                            </button>
                                                            <button
                                                                onClick={() => deleteVersion(version.id)}
                                                                className="px-2 py-1 text-xs font-medium rounded-md transition bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                                                title="Excluir versão"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Proteção com PIN
                                    </h3>
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${isProtected
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        {isProtected ? "🔒 Ativo" : "🔓 Inativo"}
                                    </span>
                                </div>

                                {isProtected ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Esta nota está protegida por PIN. Clique abaixo para remover a proteção.
                                        </p>
                                        <button
                                            onClick={handleRemovePin}
                                            disabled={isLoading}
                                            className="w-full px-3 py-2.5 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            {isLoading ? "Removendo..." : "Remover PIN"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                PIN (4-8 dígitos)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value)}
                                                    placeholder="Ex: 1234"
                                                    maxLength={8}
                                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                                                    aria-label={showPassword ? "Ocultar PIN" : "Mostrar PIN"}
                                                >
                                                    {showPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M17.94 17.94A10.07 10.07 0 003.12 12.62c2.77-4.87 7.2-6.18 8.02-6.85a10 10 0 017.7 7.71"></path>
                                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Confirmar PIN
                                            </label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value)}
                                                placeholder="Repita o PIN"
                                                maxLength={8}
                                                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSavePin}
                                            disabled={isLoading || !pin.trim()}
                                            className="w-full px-3 py-2.5 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                                        >
                                            {isLoading ? "Salvando..." : "✓ Salvar PIN"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Danger Tab */}
                        {activeTab === 'danger' && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                                    Zona de Perigo
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Ações irreversíveis. Tenha cuidado ao usar estas opções.
                                </p>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={handleDeleteDocument}
                                        disabled={isLoading || isDeleting}
                                        className="w-full px-3 py-2.5 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                        🗑️ Deletar nota permanentemente
                                    </button>
                                ) : (
                                    <div className="space-y-2 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                            ⚠️ Tem certeza? Esta ação é permanente e não pode ser desfeita.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleDeleteDocument}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700"
                                            >
                                                {isDeleting ? "Deletando..." : "Confirmar"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
