"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitizeDocumentId } from "@/lib/colors";

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
            <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
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
                            href="#features"
                            className="text-slate-600 hover:text-slate-900 transition no-underline"
                        >
                            Recursos
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 transition no-underline">
                            GitHub
                        </a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
                <div className="text-center mb-12 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                        Colaboração em texto,<br />
                        <span className="text-slate-500">
                            simples e eficiente.
                        </span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Edição de texto em tempo real, sem cadastro, sem complicações.
                        A ferramenta ideal para notas rápidas, snippets de código e colaboração instantânea.
                    </p>
                </div>

                {/* Create Document Form */}
                <div className="w-full max-w-md mb-16">
                    <form onSubmit={handleCreateDocument} className="flex gap-2 shadow-sm p-1 bg-white rounded-lg border border-slate-200">
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
                            className="px-6 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Ir
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        Digite o nome de um documento para criar ou acessar.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    <ExampleCard
                        title="Reuniões"
                        description="Pautas e atas de reunião em tempo real."
                        docName="reuniao-sprint"
                        icon="📅"
                    />
                    <ExampleCard
                        title="Código"
                        description="Compartilhe snippets sem formatação."
                        docName="snippet-codigo"
                        icon="💻"
                    />
                    <ExampleCard
                        title="Notas"
                        description="Lista de tarefas e anotações rápidas."
                        docName="minhas-notas"
                        icon="📝"
                    />
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="border-t border-slate-200 bg-white py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            Simplicidade em primeiro lugar
                        </h3>
                        <p className="text-slate-600">Focado na velocidade e facilidade de uso.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        <Feature
                            title="Instantâneo"
                            description="Sem login, sem configuração. Apenas digite a URL e comece a usar."
                        />
                        <Feature
                            title="Sincronização Real-time"
                            description="Veja o cursor e as edições dos seus colegas enquanto eles digitam."
                        />
                        <Feature
                            title="URLs Amigáveis"
                            description="Crie links fáceis de lembrar e compartilhar verbalmente."
                        />
                        <Feature
                            title="Subdocumentos"
                            description="Organize conteúdo hierarquicamente usando barras na URL."
                        />
                        <Feature
                            title="Salvamento Automático"
                            description="Nunca perca seu trabalho. Tudo é salvo na nuvem instantaneamente."
                        />
                        <Feature
                            title="Markdown & Texto"
                            description="Suporte para formatação rica ou texto puro, como você preferir."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-300 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">DP</span>
                        </div>
                        <span className="font-semibold text-slate-700">DontPad BR</span>
                    </div>
                    <p>
                        &copy; {new Date().getFullYear()} DontPad BR. Open Source.
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
    icon
}: {
    title: string;
    description: string;
    docName: string;
    icon: string;
}) {
    return (
        <Link href={`/${encodeURIComponent(docName)}`} className="no-underline">
            <div className="group p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 h-full">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
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
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-slate-900 text-lg">{title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
