"use client";

import { useState } from "react";
import { hashPin } from "@/lib/crypto";

interface PasswordProtectionProps {
    documentId: string;
    passwordHash: string;
    onUnlock: () => void;
}

export function PasswordProtection({
    documentId,
    passwordHash,
    onUnlock,
}: PasswordProtectionProps) {
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const enteredHash = await hashPin(pin);

            if (enteredHash === passwordHash) {
                sessionStorage.setItem(
                    `doc_unlocked_${documentId}`,
                    "true"
                );
                onUnlock();
            } else {
                setError("PIN incorreto");
                setPin("");
            }
        } catch (err) {
            console.error("Failed to verify PIN:", err);
            setError("Erro ao verificar PIN");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm mx-4">
                {/* Glassmorphic Card */}
                <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-6 text-center border-b border-white/10 dark:border-slate-700/20">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 backdrop-blur-md border border-white/20 mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-slate-900 dark:text-white"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0110 0v4"></path>
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Nota Protegida
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Digite o PIN para continuar
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleUnlock} className="px-6 py-8 space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3.5 rounded-lg backdrop-blur-sm bg-red-500/10 dark:bg-red-600/10 border border-red-300/30 dark:border-red-700/30">
                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* PIN Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                PIN
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="0000"
                                    maxLength={8}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 text-center text-2xl font-semibold tracking-widest rounded-xl border border-white/20 dark:border-slate-700/30 backdrop-blur-sm bg-white/50 dark:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={showPassword ? "Ocultar PIN" : "Mostrar PIN"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 003.12 12.62c2.77-4.87 7.2-6.18 8.02-6.85a10 10 0 017.7 7.71"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!pin.trim() || isLoading}
                            className="w-full py-3.5 px-4 text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl active:scale-95"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                "🔓 Desbloquear"
                            )}
                        </button>

                        {/* Info Text */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                            Digite o PIN para acessar a nota
                        </p>
                    </form>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                    {decodeURIComponent(documentId).length > 30
                        ? decodeURIComponent(documentId).substring(0, 30) + "..."
                        : decodeURIComponent(documentId)}
                </p>
            </div>
        </div>
    );
}

