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
import { syncXmlFragmentToText, syncTextToXmlFragment } from "@/lib/editorSync";
import { EditorSwitchModal, EditorSwitchIcon } from "./EditorSwitchModal";
import { SyncStatus } from "./SyncStatus";
import dynamic from 'next/dynamic';
const VoiceChat = dynamic(() => import('./VoiceChat').then(m => m.VoiceChat), { ssr: false });

interface DocumentViewProps {
    documentId: string;
    subdocumentName?: string;
}

export function DocumentView({ documentId, subdocumentName }: DocumentViewProps) {
    const provider = useYjsProvider();
    const doc = useYDoc();
    const [showSubdocs, setShowSubdocs] = useState(false);
    const [showVoiceChat, setShowVoiceChat] = useState(false);
    const [editorType, setEditorType] = useState<"blocknote" | "codemirror">("codemirror");
    const { toast, showToast } = useToast();
    const [hideToast, setHideToast] = useState(false);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const previousEditorType = useRef<"blocknote" | "codemirror">("codemirror");
    const hasInitialized = useRef(false);
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
                    setEditorType(saved);
                    previousEditorType.current = saved;
                    meta.set(key, saved);
                }
            }

            // mark as initialized to avoid running sync conversions on initial mount
            hasInitialized.current = true;

            const observer = (events: any) => {
                try {
                    const val = meta.get(key) as "blocknote" | "codemirror" | undefined | null;
                    console.debug("metadata.observer fired", { key, val, previous: previousEditorType.current });
                    if (val && val !== previousEditorType.current) {
                        console.debug("metadata.observer updating editorType", { from: previousEditorType.current, to: val });
                        // Apply change; this was originated remotely
                        applyEditorChange(previousEditorType.current as "blocknote" | "codemirror", val, false).catch((e) => console.debug("applyEditorChange:error", e));
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
            hasInitialized.current = true;
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

    // Funções para sincronizar explicitamente (chamadas apenas em ações de usuário
    // ou quando a mudança de editor é observada no metadata)
    const syncToCodeMirror = useCallback(() => {
        const xmlFragment = doc.getXmlFragment(fragmentKey);
        const yText = doc.getText(textKey);
        console.debug("syncToCodeMirror: XmlFragment -> Y.Text (before)", { xmlLength: xmlFragment.length, yTextBefore: yText.toString().slice(0, 200) });
        syncXmlFragmentToText(xmlFragment, yText, doc);
        console.debug("syncToCodeMirror: XmlFragment -> Y.Text (after)", { yTextAfter: yText.toString().slice(0, 200) });
        previousEditorType.current = "codemirror";
    }, [doc, fragmentKey, textKey]);

    const syncToBlockNote = useCallback(() => {
        const xmlFragment = doc.getXmlFragment(fragmentKey);
        const yText = doc.getText(textKey);
        console.debug("syncToBlockNote: Y.Text -> XmlFragment");
        // Use text->xml conversion which will be reflected to the BlockNote via Yjs
        try {
            syncTextToXmlFragment(yText, xmlFragment, doc);
        } catch (e) {
            // Fallback: try manual replace via editor if available
            try {
                const textContent = yText.toString();
                const lines = textContent ? textContent.split("\n") : [""];
                const blocks = lines.map((line) => ({ type: "paragraph" as const, content: line }));
                editor.replaceBlocks(editor.document, blocks);
            } catch (err) {
                console.error("syncToBlockNote failed:", err);
            }
        }
        previousEditorType.current = "blocknote";
    }, [doc, fragmentKey, textKey, editor]);

    // Apply a change explicitly (used by toggle and metadata observer)
    const applyEditorChange = useCallback(
        async (from: "blocknote" | "codemirror", to: "blocknote" | "codemirror", initiatedByUser = false) => {
            if (from === to) return;

            // If not initialized (first mount), don't perform conversions automatically
            if (!hasInitialized.current && !initiatedByUser) {
                console.debug("applyEditorChange: skipping initial conversion", { from, to });
                previousEditorType.current = to;
                setEditorType(to);
                return;
            }

            if (to === "codemirror") {
                syncToCodeMirror();
                setEditorType("codemirror");
            } else {
                await syncToBlockNote();
                setEditorType("blocknote");
            }
        },
        [syncToBlockNote, syncToCodeMirror]
    );

    // Toggle editor type
    const toggleEditor = useCallback(() => {
        const prev = previousEditorType.current;
        const newType = prev === "blocknote" ? "codemirror" : "blocknote";
        console.debug("toggleEditor called", { prev, newType });

        localStorage.setItem("editor-preference", newType);
        try {
            const meta = doc.getMap("metadata");
            const key = `editorType:${fragmentKey}`;
            meta.set(key, newType);
            console.debug("toggleEditor:meta.set", { key, newType });
        } catch (e) {
            console.debug("toggleEditor:meta.set:error", e);
        }

        // Apply change explicitly (user-initiated)
        applyEditorChange(prev as "blocknote" | "codemirror", newType, true).catch((e) => console.debug("applyEditorChange:error", e));
        showToast(`Editor alterado para ${newType === "blocknote" ? "BlockNote" : "CodeMirror"}`);
    }, [doc, fragmentKey, applyEditorChange]);

    // Abrir modal de confirmação de troca
    const handleEditorSwitchRequest = useCallback(() => {
        setShowSwitchModal(true);
    }, []);

    // Handler idempotente: define explicitamente o editor para evitar double-toggle
    const handleConfirmSwitch = useCallback((newType: "blocknote" | "codemirror") => {
        const prev = previousEditorType.current;
        // Persist preference
        localStorage.setItem("editor-preference", newType);
        try {
            const meta = doc.getMap("metadata");
            const key = `editorType:${fragmentKey}`;
            meta.set(key, newType);
            console.debug("handleConfirmSwitch: meta.set", { key, newType });
        } catch (e) {
            console.debug("handleConfirmSwitch: meta.set:error", e);
        }

        // Apply change explicitly (user-initiated)
        applyEditorChange(prev as "blocknote" | "codemirror", newType, true).catch((e) => console.debug("applyEditorChange:error", e));
        showToast(`Editor alterado para ${newType === "blocknote" ? "BlockNote" : "CodeMirror"}`);
    }, [doc, fragmentKey, applyEditorChange]);

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
                            className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
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

                {/* Subdocuments Panel (overlay, not pushing layout) */}
                {showSubdocs && (
                    <>
                        {/* Backdrop (mobile and desktop) */}
                        <div
                            className="fixed inset-0 bg-black/40 z-30 md:hidden"
                            onClick={() => setShowSubdocs(false)}
                        />

                        <aside className="fixed top-16 right-0 bottom-0 md:w-80 w-full border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-auto shadow-lg z-40 transition-transform duration-200 ease-out">
                            <div className="flex items-start justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Subdocuments</div>
                                <button
                                    onClick={() => setShowSubdocs(false)}
                                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                    aria-label="Fechar subdocs"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4">
                                <SubdocumentManager documentId={documentId} />
                            </div>
                        </aside>
                    </>
                )}
            </div>

            {/* Modal de confirmação de troca de editor */}
            <EditorSwitchModal
                isOpen={showSwitchModal}
                onClose={() => setShowSwitchModal(false)}
                onConfirm={handleConfirmSwitch}
                currentEditor={editorType}
            />

            {/* Voice Chat PoC */}
            {showVoiceChat && (
                <VoiceChat documentId={documentId} onClose={() => setShowVoiceChat(false)} />
            )}
        </div>
    );
}
