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
                sessionStorage.setItem(`doc_unlocked_${documentId}`, "true");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Card */}
            <div className="relative w-full max-w-sm">
                {/* Glassmorphic Card */}
                <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-6 text-center">
                        {/* Lock Icon */}
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25 mb-5">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0110 0v4"></path>
                            </svg>
                        </div>

                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            Nota Protegida
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Digite o PIN para desbloquear
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleUnlock} className="px-6 pb-8 space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* PIN Input */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••"
                                maxLength={8}
                                autoFocus
                                disabled={isLoading}
                                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition disabled:opacity-50"
                                aria-label={showPassword ? "Ocultar PIN" : "Mostrar PIN"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!pin.trim() || isLoading}
                            className="w-full py-3.5 px-4 text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                "Desbloquear"
                            )}
                        </button>
                    </form>
                </div>

                {/* Document name hint */}
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 truncate px-4">
                    {decodeURIComponent(documentId)}
                </p>
            </div>
        </div>
    );
}
