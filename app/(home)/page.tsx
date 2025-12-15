"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitizeDocumentId } from "@/lib/colors";
import { CollaborationDemo } from "@/components/CollaborationDemo";
import { MetricsSection } from "@/components/MetricsSection";
import { HeroTypingAnimation } from "@/components/HeroTypingAnimation";
import { LiveStatsIndicator } from "@/components/LiveStatsIndicator";

export default function HomePage() {
    const [documentName, setDocumentName] = useState("");
    const router = useRouter();

    const handleCreateDocument = (e: React.FormEvent) => {
        e.preventDefault();
        if (documentName.trim()) {
            const sanitized = sanitizeDocumentId(documentName);
            router.push(`/${encodeURIComponent(sanitized)}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm tracking-tighter">DP</span>
                        </div>
                        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                            DontPad BR
                        </h1>
                    </div>
                    <nav className="flex gap-8 text-sm font-medium">
                        <a
                            href="#demo"
                            className="text-slate-600 hover:text-slate-900 transition no-underline"
                        >
                            Demo
                        </a>
                        <a
                            href="#features"
                            className="text-slate-600 hover:text-slate-900 transition no-underline"
                        >
                            Recursos
                        </a>
                        <a
                            href="#metrics"
                            className="text-slate-600 hover:text-slate-900 transition no-underline"
                        >
                            Métricas
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-slate-50 to-white">
                    <div className="text-center mb-12 max-w-3xl animate-fade-in-up">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                            Colaboração em texto,<br />
                            <span className="text-slate-500 relative inline-block min-h-[1.2em] pl-8">
                                <HeroTypingAnimation />
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Edição de texto em tempo real, sem cadastro, sem complicações.
                            A ferramenta ideal para notas rápidas, snippets de código e colaboração instantânea.
                        </p>
                        <LiveStatsIndicator />
                    </div>

                    {/* Create Document Form */}
                    <div className="w-full max-w-md mb-16 animate-fade-in-up animation-delay-200">
                        <form onSubmit={handleCreateDocument} className="flex gap-2 shadow-lg p-1.5 bg-white rounded-xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex-1 flex items-center px-4">
                                <span className="text-slate-400 mr-1">/</span>
                                <input
                                    type="text"
                                    placeholder="seu-documento"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    className="flex-1 py-3 bg-transparent border-none focus:outline-none text-slate-900 placeholder-slate-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!documentName.trim()}
                                className="px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                            >
                                Ir →
                            </button>
                        </form>
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Digite o nome de um documento para criar ou acessar.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-fade-in-up animation-delay-400">
                        <ExampleCard
                            title="Reuniões"
                            description="Pautas e atas de reunião em tempo real."
                            docName="reuniao-sprint"
                            icon="📅"
                            delay={0}
                        />
                        <ExampleCard
                            title="Código"
                            description="Compartilhe snippets sem formatação."
                            docName="snippet-codigo"
                            icon="💻"
                            delay={100}
                        />
                        <ExampleCard
                            title="Notas"
                            description="Lista de tarefas e anotações rápidas."
                            docName="minhas-notas"
                            icon="📝"
                            delay={200}
                        />
                    </div>
                </section>

                {/* Collaboration Demo Section */}
                <section id="demo" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                                Veja a colaboração em ação
                            </h3>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                Múltiplos usuários editando simultaneamente, com cursores coloridos e sincronização instantânea.
                            </p>
                        </div>
                        <CollaborationDemo />
                    </div>
                </section>

                {/* Metrics Section */}
                <div id="metrics">
                    <MetricsSection />
                </div>

                {/* Features Section */}
                <section id="features" className="border-t border-slate-200 bg-white py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                                Simplicidade em primeiro lugar
                            </h3>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                Focado na velocidade e facilidade de uso. Sem distrações, apenas o essencial.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                            <Feature
                                title="Instantâneo"
                                description="Sem login, sem configuração. Apenas digite a URL e comece a usar imediatamente."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Sincronização Real-time"
                                description="Veja o cursor e as edições dos seus colegas enquanto eles digitam."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                }
                            />
                            <Feature
                                title="URLs Amigáveis"
                                description="Crie links fáceis de lembrar e compartilhar verbalmente."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Subdocumentos"
                                description="Organize conteúdo hierarquicamente usando barras na URL."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Salvamento Automático"
                                description="Nunca perca seu trabalho. Tudo é salvo na nuvem instantaneamente."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Markdown & Texto"
                                description="Suporte para formatação rica ou texto puro, como você preferir."
                                icon={
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6 bg-slate-900 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl md:text-4xl font-bold mb-6">
                            Pronto para colaborar?
                        </h3>
                        <p className="text-slate-400 mb-8 text-lg">
                            Comece agora mesmo. Basta criar uma URL e compartilhar com sua equipe.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/meu-primeiro-documento"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition no-underline"
                            >
                                Começar agora →
                            </Link>
                            <a
                                href="#demo"
                                className="inline-flex items-center justify-center px-8 py-4 border border-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition no-underline"
                            >
                                Ver demo
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">DP</span>
                        </div>
                        <span className="font-semibold text-slate-700">DontPad BR</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#features" className="hover:text-slate-700 transition no-underline">Recursos</a>
                        <a href="#demo" className="hover:text-slate-700 transition no-underline">Demo</a>
                        <a href="#metrics" className="hover:text-slate-700 transition no-underline">Métricas</a>
                    </div>
                    <p>
                        &copy; {new Date().getFullYear()} DontPad BR. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function ExampleCard({
    title,
    description,
    docName,
    icon,
    delay = 0
}: {
    title: string;
    description: string;
    docName: string;
    icon: string;
    delay?: number;
}) {
    return (
        <Link href={`/${encodeURIComponent(docName)}`} className="no-underline group">
            <div
                className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 h-full transform hover:-translate-y-1"
            >
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-300">{icon}</span>
                    <h4 className="font-semibold text-slate-900">{title}</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            </div>
        </Link>
    );
}

function Feature({
    title,
    description,
    icon,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-slate-900 text-lg mb-1">{title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
