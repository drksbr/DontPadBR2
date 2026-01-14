"use client";

import { YDocProvider } from "@y-sweet/react";
import { useState, useEffect, useCallback } from "react";
import type { ClientToken } from "@y-sweet/sdk";

interface SecurityStatus {
    isProtected: boolean;
    hasAccess: boolean;
}

interface SecureDocumentProviderProps {
    documentId: string;
    authEndpoint: () => Promise<ClientToken>;
    children: React.ReactNode;
}

/**
 * Provider seguro que verifica autenticação antes de carregar o documento Y-Sweet.
 * Se o documento está protegido e o usuário não tem acesso, mostra tela de PIN.
 */
export function SecureDocumentProvider({
    documentId,
    authEndpoint,
    children,
}: SecureDocumentProviderProps) {
    const [status, setStatus] = useState<SecurityStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verificar status de segurança
    const checkSecurity = useCallback(async () => {
        try {
            console.log(`[SecureDocumentProvider] Verificando segurança do documento: ${documentId}`);
            const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/security`);
            if (response.ok) {
                const data: SecurityStatus = await response.json();
                console.log(`[SecureDocumentProvider] Status recebido:`, data);
                setStatus(data);
            } else {
                // Se falhar, assume não protegido
                console.warn(`[SecureDocumentProvider] Falha ao verificar segurança, status: ${response.status}`);
                setStatus({ isProtected: false, hasAccess: true });
            }
        } catch (err) {
            console.error("[SecureDocumentProvider] Erro ao verificar segurança:", err);
            setStatus({ isProtected: false, hasAccess: true });
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    useEffect(() => {
        checkSecurity();
    }, [checkSecurity]);

    // Verificar PIN
    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsVerifying(true);

        try {
            console.log(`[SecureDocumentProvider] Enviando PIN para verificação do documento: ${documentId}`);
            const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/verify-pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });

            const data = await response.json();

            if (data.success) {
                // PIN correto! Recarregar status de segurança
                console.log("[SecureDocumentProvider] PIN verificado com sucesso!");
                await checkSecurity();
            } else {
                console.warn("[SecureDocumentProvider] Erro na verificação:", data.error);
                setError(data.error || "PIN incorreto");
                setPin("");
            }
        } catch (err) {
            console.error("[SecureDocumentProvider] Erro ao verificar PIN:", err);
            setError("Erro ao verificar PIN");
        } finally {
            setIsVerifying(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // Documento protegido e sem acesso - mostrar tela de PIN
    if (status?.isProtected && !status?.hasAccess) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
                {/* Header */}
                <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <a
                                href="/"
                                className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded flex items-center justify-center"
                            >
                                <span className="text-white dark:text-slate-900 font-bold text-sm tracking-tighter">DP</span>
                            </a>
                            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                                {decodeURIComponent(documentId)}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-md">
                        {/* Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 p-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
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
                                        className="text-slate-600 dark:text-slate-400"
                                    >
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    Nota Protegida
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Digite o PIN para acessar este documento
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleVerifyPin} className="space-y-4">
                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
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
                                        placeholder="••••••"
                                        maxLength={8}
                                        autoFocus
                                        disabled={isVerifying}
                                        className="w-full px-4 py-3 text-center text-xl font-medium tracking-[0.3em] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isVerifying}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition disabled:opacity-50"
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
                                    disabled={!pin.trim() || isVerifying}
                                    className="w-full py-3 px-4 text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 active:scale-[0.98]"
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                                            Verificando...
                                        </span>
                                    ) : (
                                        "Desbloquear"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Back link */}
                        <div className="mt-6 text-center">
                            <a
                                href="/"
                                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                            >
                                ← Voltar para a página inicial
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Tem acesso - renderizar YDocProvider
    return (
        <YDocProvider docId={documentId} authEndpoint={authEndpoint} showDebuggerLink={false}>
            {children}
        </YDocProvider>
    );
}
