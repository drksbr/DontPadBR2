"use client";

import { useState, useEffect } from "react";
import { useMap } from "@y-sweet/react";
import { hashPin } from "@/lib/crypto";

interface DocumentSettingsProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentSettings({ documentId, isOpen, onClose }: DocumentSettingsProps) {
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

    const showMessage = (msg: string, type: "success" | "error") => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 3000);
    };

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
            const pinHash = await hashPin(pin);

            // Save to Y-Sweet
            securityMap.set("protected", true);
            securityMap.set("passwordHash", pinHash);
            securityMap.set("createdAt", new Date().toISOString());

            setIsProtected(true);
            setPin("");
            setConfirmPin("");
            showMessage("PIN configurado com sucesso! ✓", "success");
        } catch (error) {
            console.error("Failed to save PIN:", error);
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
            // Remove from Y-Sweet
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
                role="presentation"
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full border border-slate-200/50 dark:border-slate-700/50">
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

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
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

                        {/* PIN Protection Section */}
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

                        {/* Divider */}
                        <div className="h-px bg-slate-200/50 dark:bg-slate-700/50" />

                        {/* Danger Zone */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                                Zona de Perigo
                            </h3>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={handleDeleteDocument}
                                    disabled={isLoading || isDeleting}
                                    className="w-full px-3 py-2.5 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                    🗑️ Deletar nota
                                </button>
                            ) : (
                                <div className="space-y-2 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                        ⚠️ Tem certeza? Esta ação é permanente.
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
                    </div>
                </div>
            </div>
        </div>
    );
}

