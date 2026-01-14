"use client";

import { SubdocumentManager } from "./SubdocumentManager";
import { Toast, useToast } from "./Toast";
import { TextEditor } from "./TextEditor";
import { FileManager } from "./FileManager";
import { DocumentSettings } from "./DocumentSettings";
import { PasswordProtection } from "./PasswordProtection";
import Link from "next/link";
import { useState, useEffect } from "react";
import { SyncStatus } from "./SyncStatus";
import { useMap } from "@y-sweet/react";
import dynamic from 'next/dynamic';
// const VoiceChat = dynamic(() => import('./VoiceChat').then(m => m.VoiceChat), { ssr: false });

interface DocumentViewProps {
    documentId: string;
    subdocumentName?: string;
}

export function DocumentView({ documentId, subdocumentName }: DocumentViewProps) {
    const [showSubdocs, setShowSubdocs] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [showVoiceChat, setShowVoiceChat] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(true);
    const [isCheckingPassword, setIsCheckingPassword] = useState(true);
    const [passwordHash, setPasswordHash] = useState<string | null>(null);
    const { toast, showToast } = useToast();
    const [hideToast, setHideToast] = useState(false);
    const securityMap = useMap("security");

    // Check if document is protected using Y-Sweet
    useEffect(() => {
        if (!securityMap) {
            // Y-Sweet not ready yet, wait
            return;
        }

        try {
            // Check session storage first for current session
            const sessionKey = `doc_unlocked_${documentId}`;
            const isSessionUnlocked = sessionStorage.getItem(sessionKey) === "true";

            // Get protection settings from Y-Sweet security map
            const isProtected = securityMap.get("protected") === true;
            const hash = securityMap.get("passwordHash") || null;

            setPasswordHash(hash as string | null);

            if (isProtected && !isSessionUnlocked) {
                setIsUnlocked(false);
            } else {
                setIsUnlocked(true);
            }
        } catch (error) {
            console.error("Error checking document protection:", error);
            setIsUnlocked(true);
            setPasswordHash(null);
        }

        setIsCheckingPassword(false);
    }, [securityMap, documentId]);

    const handleShowFiles = () => {
        setShowFiles(true);
        setShowSubdocs(false);
    };

    const handleShowSubdocs = () => {
        setShowSubdocs(true);
        setShowFiles(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copiado com sucesso!");
            setHideToast(false);
        } catch (err) {
            showToast("Erro ao copiar link");
        }
    };

    // Show password protection screen if needed
    if (isCheckingPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isUnlocked && passwordHash) {
        return (
            <PasswordProtection
                documentId={documentId}
                passwordHash={passwordHash}
                onUnlock={() => {
                    setIsUnlocked(true);
                    sessionStorage.setItem(`doc_unlocked_${documentId}`, "true");
                }}
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm tracking-tighter hover:text-gray-400 dark:hover:text-slate-600 hover:tracking-tighter transition"
                        >
                            DP
                        </Link>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                <Link
                                    href={`/${encodeURIComponent(documentId)}`}
                                    className="hover:text-slate-700 dark:hover:text-slate-300 transition"
                                    title={decodeURIComponent(documentId)}
                                >
                                    {/* Mobile: truncated (<=20 -> show full, >=20 -> cut to 17 + '...') */}
                                    <span className="inline md:hidden">
                                        {(() => {
                                            const name = decodeURIComponent(documentId);
                                            return name.length >= 20 ? name.slice(0, 17) + "..." : name;
                                        })()}
                                    </span>

                                    {/* Desktop/tablet: full name */}
                                    <span className="hidden md:inline">{decodeURIComponent(documentId)}</span>
                                </Link>
                                {subdocumentName && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-600">/</span>
                                        <span className="text-slate-600 dark:text-slate-400">{decodeURIComponent(subdocumentName)}</span>
                                    </>
                                )}
                            </div>
                            { /* Sync status + collaborator count */}
                            <SyncStatus />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShowFiles}
                            className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-md border transition ${showFiles
                                ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            title={showFiles ? "Fechar arquivos" : "Abrir arquivos"}
                            aria-label={showFiles ? "Fechar arquivos" : "Abrir arquivos"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span className="hidden md:inline text-sm font-medium">
                                {showFiles ? "Fechar" : "Arquivos"}
                            </span>
                        </button>
                        <button
                            onClick={handleShowSubdocs}
                            className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-md border transition ${showSubdocs
                                ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            title={showSubdocs ? "Fechar subdocs" : "Abrir subdocs"}
                            aria-label={showSubdocs ? "Fechar subdocs" : "Abrir subdocs"}
                        >
                            {/* Ícone sempre visível; texto só em md+ */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span className="hidden md:inline text-sm font-medium">
                                {showSubdocs ? "Fechar" : "Subdocs"}
                            </span>
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
                            title="Copiar link"
                            aria-label="Copiar link"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>

                        {/* Voice Chat */}
                        <button
                            onClick={() => setShowVoiceChat(true)}
                            className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
                            title="Entrar com voz"
                            aria-label="Entrar com voz"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1v11" />
                                <path d="M19 11a7 7 0 01-14 0" />
                            </svg>
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
                            title="Configurações da nota"
                            aria-label="Configurações da nota"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Toast Notification */}
            {toast && !hideToast && (
                <Toast
                    message={toast.message}
                    onClose={() => setHideToast(true)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor */}
                <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 w-full">
                    <TextEditor documentId={documentId} subdocumentName={subdocumentName} />
                </div>

                {/* Subdocuments and Files Panels (overlay, not pushing layout) */}
                {(showSubdocs || showFiles) && (
                    <>
                        {/* Backdrop (mobile and desktop) */}
                        <div
                            className="fixed inset-0 bg-black/40 z-30 md:hidden"
                            onClick={() => {
                                setShowSubdocs(false);
                                setShowFiles(false);
                            }}
                            role="presentation"
                        />

                        {/* Files Panel */}
                        <aside
                            className={`fixed top-16 right-0 bottom-0 md:w-96 w-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto shadow-lg z-40 transition-transform duration-200 ease-out ${showFiles ? 'translate-x-0' : 'translate-x-full md:translate-x-full'
                                }`}
                            style={{ display: showFiles ? 'flex' : 'none', flexDirection: 'column' }}
                        >
                            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Arquivos</h2>
                                <button
                                    onClick={() => setShowFiles(false)}
                                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                    aria-label="Fechar arquivos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <FileManager documentId={documentId} subdocumentId={subdocumentName} />
                            </div>
                        </aside>

                        {/* Subdocuments Panel */}
                        <aside
                            className={`fixed top-16 right-0 bottom-0 md:w-96 w-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto shadow-lg z-40 transition-transform duration-200 ease-out ${showSubdocs ? 'translate-x-0' : 'translate-x-full md:translate-x-full'
                                }`}
                            style={{ display: showSubdocs ? 'flex' : 'none', flexDirection: 'column' }}
                        >
                            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Subdocuments</h2>
                                <button
                                    onClick={() => setShowSubdocs(false)}
                                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                    aria-label="Fechar subdocs"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <SubdocumentManager documentId={documentId} />
                            </div>
                        </aside>
                    </>
                )}
            </div>

            {/* Voice Chat PoC
            {showVoiceChat && (
                <VoiceChat documentId={documentId} onClose={() => setShowVoiceChat(false)} />
            )} */}

            {/* Document Settings */}
            <DocumentSettings
                documentId={documentId}
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
}
