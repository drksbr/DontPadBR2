"use client";

import { useEffect, useState } from "react";

interface EditorSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newEditor: "blocknote" | "codemirror") => void;
    currentEditor: "blocknote" | "codemirror";
}

export function EditorSwitchModal({
    isOpen,
    onClose,
    onConfirm,
    currentEditor,
}: EditorSwitchModalProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const targetEditor = currentEditor === "blocknote" ? "CodeMirror" : "BlockNote";
    const targetKey: "blocknote" | "codemirror" = currentEditor === "blocknote" ? "codemirror" : "blocknote";

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Pequeno delay para garantir que a animação de entrada funcione
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            // Aguarda a animação de saída completar antes de remover do DOM
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Fechar ao pressionar Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
                }`}
            onClick={onClose}
        >
            {/* Backdrop com glassmorfismo */}
            <div
                className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
                    }`}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating
                    ? "scale-100 translate-y-0 opacity-100"
                    : "scale-95 translate-y-4 opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Card com glassmorfismo */}
                <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl">
                    {/* Efeito de brilho no topo */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                    {/* Gradiente decorativo */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-3xl" />

                    {/* Conteúdo */}
                    <div className="relative p-6">
                        {/* Ícone de aviso */}
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm">
                            <svg
                                className="h-7 w-7 text-amber-600 dark:text-amber-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                />
                            </svg>
                        </div>

                        {/* Título */}
                        <h3 className="mb-2 text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Trocar para {targetEditor}?
                        </h3>

                        {/* Descrição */}
                        <p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Ao trocar de editor, algumas{" "}
                            <span className="font-medium text-amber-700 dark:text-amber-400">formatações podem ser perdidas</span>.
                            O conteúdo de texto será mantido, mas estilos específicos de cada editor podem não ser preservados.
                        </p>

                        {/* Botões */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm active:scale-[0.98]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm(targetKey);
                                    onClose();
                                }}
                                className="flex-1 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-200 px-4 py-2.5 text-sm font-medium text-white dark:text-slate-900 shadow-lg shadow-slate-900/25 dark:shadow-slate-900/50 transition-all hover:from-slate-700 hover:to-slate-800 dark:hover:from-white dark:hover:to-slate-100 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98]"
                            >
                                Confirmar troca
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ícone do botão de troca de editor
export function EditorSwitchIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.5}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
        </svg>
    );
}
