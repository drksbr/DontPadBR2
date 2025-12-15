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

    // Load editor preference from localStorage (apenas no mount)
    useEffect(() => {
        const saved = localStorage.getItem("editor-preference") as "blocknote" | "codemirror" | null;
        if (saved) {
            setEditorType(saved);
            previousEditorType.current = saved;
        }
    }, []);

    // Criar o editor BlockNote - SEMPRE criar, mas só renderizar quando necessário
    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment: doc.getXmlFragment(fragmentKey),
            user: { name: "Colaborador", color: collaboratorColor },
        },
    });

    // Sincronizar conteúdo quando trocar de editor
    useEffect(() => {
        const prev = previousEditorType.current;
        const current = editorType;

        // Se mudou de editor, sincronizar
        if (prev !== current) {
            const xmlFragment = doc.getXmlFragment(fragmentKey);
            const yText = doc.getText(textKey);

            if (current === "codemirror") {
                // Saindo do BlockNote, indo para CodeMirror
                // Sincroniza XmlFragment -> Y.Text
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
                        editor.replaceBlocks(editor.document, blocks);
                    } catch (e) {
                        console.error("Erro ao substituir blocos:", e);
                    }
                }, 100);
            }

            previousEditorType.current = current;
        }
    }, [editorType, doc, fragmentKey, textKey, editor]);

    // Toggle editor type
    const toggleEditor = useCallback(() => {
        setEditorType((prev) => {
            const newType = prev === "blocknote" ? "codemirror" : "blocknote";
            localStorage.setItem("editor-preference", newType);
            showToast(`Editor alterado para ${newType === "blocknote" ? "BlockNote" : "CodeMirror"}`);
            return newType;
        });
    }, [showToast]);

    // Abrir modal de confirmação de troca
    const handleEditorSwitchRequest = useCallback(() => {
        setShowSwitchModal(true);
    }, []);

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
                            <span className="text-xs text-slate-500 dark:text-slate-400">Sincronizado</span>
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
                onConfirm={toggleEditor}
                currentEditor={editorType}
            />
        </div>
    );
}
