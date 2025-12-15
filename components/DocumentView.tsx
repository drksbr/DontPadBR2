"use client";

// Importar ANTES do BlockNote para suprimir warnings do linkify
import "@/components/LinkifyInit";

import { useYDoc, useYjsProvider } from "@y-sweet/react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { SubdocumentManager } from "./SubdocumentManager";
import { Toast, useToast } from "./Toast";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { generateSubdocumentFragmentKey, getCollaboratorColor } from "@/lib/colors";
import { syncXmlFragmentToText } from "@/lib/editorSync";
import { EditorSwitchModal, EditorSwitchIcon } from "./EditorSwitchModal";
import { SyncStatus } from "./SyncStatus";
import { useSyncStatus } from "@/lib/useSyncStatus";

interface DocumentViewProps {
    documentId: string;
    subdocumentName?: string;
}

export function DocumentView({ documentId, subdocumentName }: DocumentViewProps) {
    const provider = useYjsProvider();
    const doc = useYDoc();
    const [showSubdocs, setShowSubdocs] = useState(false);
    const [editorType, setEditorType] = useState<"blocknote" | "codemirror">("codemirror");
    const { toast, showToast } = useToast();
    const [hideToast, setHideToast] = useState(false);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const previousEditorType = useRef<"blocknote" | "codemirror">("codemirror");
    const hasInitialized = useRef(false);
    const isSettingMeta = useRef(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [collaboratorColor, setCollaboratorColor] = useState(() => getCollaboratorColor(false));

    // Detectar tema do sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const isDark = mediaQuery.matches;
        setIsDarkMode(isDark);
        setCollaboratorColor(getCollaboratorColor(isDark));

        const handler = (e: MediaQueryListEvent) => {
            setIsDarkMode(e.matches);
            // Manter a mesma cor, apenas ajustar para o tema
        };
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    // Generate deterministic fragment key that includes both document and subdocument info
    const fragmentKey = subdocumentName
        ? generateSubdocumentFragmentKey(documentId, subdocumentName)
        : "blocknote";

    // Key para o Y.Text do CodeMirror (baseado no mesmo fragmentKey)
    const textKey = `${fragmentKey}-text`;

    // Load editor preference from Y.Doc metadata with localStorage fallback
    useEffect(() => {
        try {
            const meta = doc.getMap("metadata");
            const key = `editorType:${fragmentKey}`;
            const savedMeta = meta.get(key) as "blocknote" | "codemirror" | undefined | null;
            if (savedMeta) {
                setEditorType(savedMeta);
                previousEditorType.current = savedMeta;
            } else {
                const saved = localStorage.getItem("editor-preference") as "blocknote" | "codemirror" | null;
                if (saved) {
                    console.debug("init: setting editorType from localStorage", { saved });
                    setEditorType(saved);
                    previousEditorType.current = saved;
                    isSettingMeta.current = true;
                    try {
                        meta.set(key, saved);
                    } finally {
                        // small delay to avoid immediate observer reaction
                        setTimeout(() => (isSettingMeta.current = false), 200);
                    }
                }
            }

            // mark as initialized to avoid running sync conversions on initial mount
            // Use a microtask to avoid race conditions where the swap effect
            // could run before we finish setting `previousEditorType`.
            setTimeout(() => {
                hasInitialized.current = true;
                console.debug("initialization complete", { editorType, previous: previousEditorType.current });
            }, 0);

            const observer = (events: any) => {
                try {
                    if (isSettingMeta.current) return;
                    const val = meta.get(key) as "blocknote" | "codemirror" | undefined | null;
                    console.debug("metadata.observer fired", { key, val, previous: previousEditorType.current });
                    if (val && val !== previousEditorType.current) {
                        console.debug("metadata.observer updating editorType", { from: previousEditorType.current, to: val });
                        setEditorType(val);
                        previousEditorType.current = val;
                    }
                } catch (e) {
                    console.debug("metadata.observer:error", e);
                }
            };

            // Y.Map doesn't have a standardized observe API on this wrapper, try 'observe'
            if (typeof (meta as any).observe === "function") {
                (meta as any).observe(observer);
                return () => (meta as any).unobserve?.(observer);
            }
        } catch (e) {
            // fallback to localStorage only
            const saved = localStorage.getItem("editor-preference") as "blocknote" | "codemirror" | null;
            if (saved) {
                setEditorType(saved);
                previousEditorType.current = saved;
            }
            // Use microtask to set initialized in fallback too
            setTimeout(() => (hasInitialized.current = true), 0);
        }
    }, [doc, fragmentKey]);

    // Criar o editor BlockNote - SEMPRE criar, mas só renderizar quando necessário
    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment: doc.getXmlFragment(fragmentKey),
            user: { name: "Colaborador", color: collaboratorColor },
        },
    });

    const { isSynced } = useSyncStatus();

    // Sincronizar conteúdo quando trocar de editor
    useEffect(() => {
        const prev = previousEditorType.current;
        const current = editorType;
        console.debug("editor swap effect", { prev, current, isSynced });

        // Devemos ignorar a primeira vez após mount/initialization
        if (!hasInitialized.current) {
            console.debug("editor swap effect: skipping because not initialized yet");
            return;
        }

        // Se não estamos sincronizados com o servidor, adie a conversão
        if (!isSynced) {
            console.debug("editor swap effect: skipping because provider not synced yet");
            return;
        }

        // Se mudou de editor, sincronizar
        if (prev !== current) {
            const xmlFragment = doc.getXmlFragment(fragmentKey);
            const yText = doc.getText(textKey);

            if (current === "codemirror") {
                // Saindo do BlockNote, indo para CodeMirror
                // Sincroniza XmlFragment -> Y.Text
                console.debug("editor swap: XmlFragment -> Y.Text");
                syncXmlFragmentToText(xmlFragment, yText, doc);
            } else {
                // Saindo do CodeMirror, indo para BlockNote
                // Usa setTimeout para dar tempo do BlockNote se estabilizar
                // antes de tentar atualizar o conteúdo
                setTimeout(() => {
                    const textContent = yText.toString();

                    // Converte texto em blocos do BlockNote
                    const lines = textContent ? textContent.split("\n") : [""];
                    const blocks = lines.map((line) => ({
                        type: "paragraph" as const,
                        content: line,
                    }));

                    // Usa replaceBlocks para substituir todo o conteúdo
                    try {
                        console.debug("editor swap: Replacing blocks in BlockNote", { blocksCount: blocks.length });
                        editor.replaceBlocks(editor.document, blocks);
                    } catch (e) {
                        console.error("Erro ao substituir blocos:", e);
                    }
                }, 100);
            }

            previousEditorType.current = current;
        }
    }, [editorType, doc, fragmentKey, textKey, editor, isSynced]);

    // Toggle editor type
    const toggleEditor = useCallback(() => {
        console.debug("toggleEditor called", { current: editorType });
        setEditorType((prev) => {
            const newType = prev === "blocknote" ? "codemirror" : "blocknote";
            console.debug("toggleEditor:setEditorType", { prev, newType });
            localStorage.setItem("editor-preference", newType);
            // Persist per-document (and per-subdocument) preference in Y.Doc metadata
            try {
                const meta = doc.getMap("metadata");
                const key = `editorType:${fragmentKey}`;
                isSettingMeta.current = true;
                try {
                    meta.set(key, newType);
                } finally {
                    setTimeout(() => (isSettingMeta.current = false), 200);
                }
                console.debug("toggleEditor:meta.set", { key, newType });
            } catch (e) {
                console.debug("toggleEditor:meta.set:error", e);
                isSettingMeta.current = false;
            }
            showToast(`Editor alterado para ${newType === "blocknote" ? "BlockNote" : "CodeMirror"}`);
            return newType;
        });
    }, [showToast, doc, fragmentKey, editorType]);

    // Abrir modal de confirmação de troca
    const handleEditorSwitchRequest = useCallback(() => {
        setShowSwitchModal(true);
    }, []);

    // Handler idempotente: define explicitamente o editor para evitar double-toggle
    const handleConfirmSwitch = useCallback((newType: "blocknote" | "codemirror") => {
        // Persist preference
        localStorage.setItem("editor-preference", newType);
        try {
            const meta = doc.getMap("metadata");
            const key = `editorType:${fragmentKey}`;
            isSettingMeta.current = true;
            try {
                meta.set(key, newType);
            } finally {
                // Delay turning off the flag to ensure observer doesn't react
                setTimeout(() => (isSettingMeta.current = false), 200);
            }
            console.debug("handleConfirmSwitch: meta.set", { key, newType });
        } catch (e) {
            console.debug("handleConfirmSwitch: meta.set:error", e);
            isSettingMeta.current = false;
        }

        // Update local state (idempotent)
        setEditorType((prev) => {
            if (prev === newType) return prev;
            return newType;
        });
        showToast(`Editor alterado para ${newType === "blocknote" ? "BlockNote" : "CodeMirror"}`);
    }, [doc, fragmentKey, showToast]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copiado com sucesso!");
            setHideToast(false);
        } catch (err) {
            showToast("Erro ao copiar link");
        }
    };

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
                                >
                                    {decodeURIComponent(documentId)}
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
                        {/* Editor Toggle Button */}
                        <button
                            onClick={handleEditorSwitchRequest}
                            className="group relative flex items-center justify-center gap-2 p-2 md:px-3 md:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200"
                            title={`Trocar para ${editorType === "blocknote" ? "CodeMirror" : "BlockNote"}`}
                        >
                            <EditorSwitchIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                            <span className="hidden md:inline text-sm font-medium">
                                {editorType === "blocknote" ? "BlockNote" : "CodeMirror"}
                            </span>
                        </button>

                        <button
                            onClick={() => setShowSubdocs(!showSubdocs)}
                            className="px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition text-sm font-medium"
                        >
                            {showSubdocs ? "Fechar" : "Subdocs"}
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
                    <div className={`w-full md:max-w-7xl md:mx-auto md:px-6 md:pt-6 ${editorType === "codemirror" ? "h-full flex flex-col md:pb-6" : "py-4 md:py-12 px-2 md:px-6"
                        }`}>
                        {editorType === "blocknote" ? (
                            <BlockNoteView editor={editor} theme={isDarkMode ? "dark" : "light"} />
                        ) : (
                            <CodeMirrorEditor doc={doc} fragmentKey={textKey} provider={provider} user={{ name: "Colaborador", color: collaboratorColor }} />
                        )}
                    </div>
                </div>

                {/* Subdocuments Panel */}
                {showSubdocs && (
                    <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-auto">
                        <SubdocumentManager documentId={documentId} />
                    </aside>
                )}
            </div>

            {/* Modal de confirmação de troca de editor */}
            <EditorSwitchModal
                isOpen={showSwitchModal}
                onClose={() => setShowSwitchModal(false)}
                onConfirm={handleConfirmSwitch}
                currentEditor={editorType}
            />
        </div>
    );
}
