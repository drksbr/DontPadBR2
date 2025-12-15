"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Subdocument } from "@/lib/types";

interface SubdocumentManagerProps {
    documentId: string;
}

export function SubdocumentManager({ documentId }: SubdocumentManagerProps) {
    const [subdocs, setSubdocs] = useState<Subdocument[]>([]);
    const [newSubdocName, setNewSubdocName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Load subdocuments from API
    useEffect(() => {
        loadSubdocuments();
    }, [documentId]);

    const loadSubdocuments = async () => {
        try {
            const response = await fetch(
                `/api/documents/${encodeURIComponent(documentId)}/subdocuments`
            );
            if (response.ok) {
                const data = await response.json();
                setSubdocs(data);
            }
        } catch (error) {
            console.error("Failed to load subdocuments:", error);
        }
    };

    const handleCreateSubdoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubdocName.trim()) return;

        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/documents/${encodeURIComponent(documentId)}/subdocuments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: newSubdocName }),
                }
            );

            if (response.ok) {
                const newSubdoc = await response.json();
                setSubdocs([...subdocs, newSubdoc]);
                setNewSubdocName("");
            }
        } catch (error) {
            console.error("Failed to create subdocument:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSubdoc = async (id: string) => {
        try {
            const response = await fetch(
                `/api/documents/${encodeURIComponent(documentId)}/subdocuments?id=${id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                setSubdocs(subdocs.filter((s) => s.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete subdocument:", error);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">Subdocumentos</h2>

            {/* Create Subdocument Form */}
            <form onSubmit={handleCreateSubdoc} className="mb-6 flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="Nome do subdoc..."
                    value={newSubdocName}
                    onChange={(e) => setNewSubdocName(e.target.value)}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400 text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100"
                />
                <button
                    type="submit"
                    disabled={!newSubdocName.trim() || isLoading}
                    className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition disabled:opacity-50 text-sm font-medium"
                >
                    {isLoading ? "Criando..." : "Criar Subdocumento"}
                </button>
            </form>

            {/* Subdocuments List */}
            <div className="flex-1 overflow-y-auto">
                {subdocs.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Nenhum subdocumento criado.</p>
                ) : (
                    <ul className="space-y-2">
                        {subdocs.map((subdoc) => (
                            <li key={subdoc.id} className="group relative">
                                <Link href={`/${encodeURIComponent(documentId)}/${encodeURIComponent(subdoc.name)}`} className="block">
                                    <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate pr-6">
                                                {subdoc.name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {new Date(subdoc.createdAt).toLocaleDateString("pt-BR")}
                                        </p>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => handleDeleteSubdoc(subdoc.id)}
                                    className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                                    title="Excluir"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
