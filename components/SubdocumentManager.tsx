"use client";

import { useState } from "react";
import Link from "next/link";
import { useMap } from "@y-sweet/react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface SubdocumentManagerProps {
    documentId: string;
}

interface SubdocumentEntry {
    id: string;
    name: string;
    createdAt: number;
}

export function SubdocumentManager({ documentId }: SubdocumentManagerProps) {
    const [newSubdocName, setNewSubdocName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subdocId: string; subdocName: string }>({
        isOpen: false,
        subdocId: "",
        subdocName: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Get subdocuments map from Y-Sweet
    // The Y.Map 'subdocuments' contains all subdocument metadata
    const subdocsMap = useMap("subdocuments");

    // Convert Y.Map to array for display
    const subdocs: SubdocumentEntry[] = subdocsMap
        ? Array.from(subdocsMap.entries()).map(([id, data]: [string, any]) => ({
            id,
            name: data.name || id,
            createdAt: data.createdAt || Date.now(),
        }))
        : [];

    const handleCreateSubdoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubdocName.trim()) return;

        setIsLoading(true);

        try {
            const trimmedName = newSubdocName.trim();

            // Sanitize name for use as Y.Map key
            const sanitizedId = trimmedName
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-+|-+$/g, "");

            if (!sanitizedId) {
                console.error("Invalid subdocument name");
                return;
            }

            // Add to Y.Map on client side
            if (subdocsMap) {
                subdocsMap.set(sanitizedId, {
                    id: sanitizedId,
                    name: trimmedName,
                    createdAt: Date.now(),
                    // Y.Array for files in this subdocument
                    files: [],
                });

                setNewSubdocName("");
            }
        } catch (error) {
            console.error("Failed to create subdocument:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSubdoc = (id: string, name: string) => {
        setDeleteModal({
            isOpen: true,
            subdocId: id,
            subdocName: name,
        });
    };

    const handleDeleteSubdocConfirm = async () => {
        if (!subdocsMap || !deleteModal.subdocId) return;

        setIsDeleting(true);
        try {
            subdocsMap.delete(deleteModal.subdocId);
            setDeleteModal({
                isOpen: false,
                subdocId: "",
                subdocName: "",
            });
        } catch (error) {
            console.error("Failed to delete subdocument:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteSubdocCancel = () => {
        setDeleteModal({
            isOpen: false,
            subdocId: "",
            subdocName: "",
        });
    };

    return (
        <div className="h-full flex flex-col" >
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">Subdocumentos</h2>

            {/* Create Subdocument Form */}
            <form onSubmit={handleCreateSubdoc} className="mb-6 flex flex-col gap-2" >
                <input
                    type="text"
                    placeholder="Nome do subdocumento..."
                    value={newSubdocName}
                    onChange={(e) => setNewSubdocName(e.target.value)}
                    disabled={isLoading || !subdocsMap}
                    className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400 text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 transition"
                />
                <button
                    type="submit"
                    disabled={!newSubdocName.trim() || isLoading || !subdocsMap}
                    className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    {isLoading ? "⏳ Criando..." : "+ Criar"}
                </button>
            </form>

            {/* Subdocuments List */}
            < div className="flex-1 overflow-auto" >
                {
                    subdocs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 dark:text-slate-500 text-sm">
                                📄 Nenhum subdocumento ainda
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                                Crie um novo acima
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {subdocs.map((subdoc) => (
                                <li key={subdoc.id} className="group">
                                    <Link href={`/${encodeURIComponent(documentId)}/${encodeURIComponent(subdoc.name)}`}>
                                        <div className="flex items-start justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                                                    📝 {subdoc.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {new Date(subdoc.createdAt).toLocaleDateString("pt-BR", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteSubdoc(subdoc.id, subdoc.name);
                                                }}
                                                className="ml-2 p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition opacity-0 group-hover:opacity-100"
                                                title="Deletar subdocumento"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
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
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )
                }
            </div >

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                title="Deletar subdocumento"
                message="Tem certeza que deseja deletar este subdocumento? Todos os arquivos anexados também serão deletados. Esta ação não pode ser desfeita."
                itemName={deleteModal.subdocName}
                isLoading={isDeleting}
                onConfirm={handleDeleteSubdocConfirm}
                onCancel={handleDeleteSubdocCancel}
            />
        </div >
    );
}
