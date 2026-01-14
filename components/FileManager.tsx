'use client'

import { useState, useEffect } from 'react'
import { useArray } from '@y-sweet/react'
import { DocumentFile } from '@/lib/types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'

interface FileManagerProps {
    documentId: string
    subdocumentId?: string
}

interface FileEntry {
    id: string
    name: string
    originalName: string
    mimeType: string
    size: number
    uploadedAt: number
}

interface UploadProgress {
    fileName: string
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
}

const ALLOWED_FORMATS = {
    office: 'DOC, DOCX, XLS, XLSX, PPT, PPTX',
    libreoffice: 'ODT, ODS, ODP',
    pdf: 'PDF',
    text: 'TXT, CSV, MD',
    images: 'JPG, PNG, GIF, WEBP, SVG, BMP, TIFF, ICO',
    videos: 'MP4, WebM, MOV, MKV, 3GP, AVI, MPEG',
    compressed: 'ZIP, RAR',
}

const MAX_FILE_SIZE_MB = 50

// Allowed MIME types for client-side validation
const ALLOWED_MIME_TYPES = [
    // Microsoft Office Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // LibreOffice / OpenDocument Formats
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    // PDF
    'application/pdf',
    // Text files
    'text/plain',
    'text/csv',
    'text/markdown',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    // Compressed files
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-rar',
    // Video files
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/3gpp',
    'video/3gpp2',
    'video/x-msvideo',
    'video/mpeg',
]

const ALLOWED_EXTENSIONS = [
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'odt', 'ods', 'odp',
    'pdf',
    'txt', 'csv', 'md',
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico',
    'zip', 'rar',
    'mp4', 'm4v', 'webm', 'mov', 'mkv', '3gp', '3g2', 'avi', 'mpeg', 'mpg',
]

export function FileManager({ documentId, subdocumentId }: FileManagerProps) {
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
    const [error, setError] = useState<string | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string; fileName: string }>({
        isOpen: false,
        fileId: '',
        fileName: '',
    })
    const [isDeleting, setIsDeleting] = useState(false)

    // Get files array from Y-Sweet
    // Document-level files: 'files' Y.Array
    // Subdocument-level files: 'subdocuments[id].files' Y.Array
    const filesArray = useArray(subdocumentId ? `subdocuments.${subdocumentId}.files` : 'files')

    // Auto-remove successful uploads after 2 seconds
    useEffect(() => {
        const successfulIndices = uploadProgress
            .map((upload, index) => (upload.status === 'success' ? index : -1))
            .filter((index) => index !== -1)

        if (successfulIndices.length === 0) return

        const timer = setTimeout(() => {
            setUploadProgress((prev) =>
                prev.filter((upload) => upload.status !== 'success')
            )
        }, 2000)

        return () => clearTimeout(timer)
    }, [uploadProgress])

    // Validate file before upload
    const isFileAllowed = (file: File): { allowed: boolean; error?: string } => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        // Check file size
        const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024
        if (file.size > maxSizeBytes) {
            return {
                allowed: false,
                error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`,
            }
        }

        // Check MIME type and extension
        const isMimeTypeAllowed = ALLOWED_MIME_TYPES.includes(file.type)
        const isExtensionAllowed = fileExtension && ALLOWED_EXTENSIONS.includes(fileExtension)

        if (!isMimeTypeAllowed && !isExtensionAllowed) {
            return {
                allowed: false,
                error: 'Tipo de arquivo não permitido. Confira os formatos aceitos.',
            }
        }

        return { allowed: true }
    }

    // Convert Y.Array to array for display
    const files: FileEntry[] = filesArray
        ? Array.from(filesArray).map((item: any) => ({
            id: item.id,
            name: item.name,
            originalName: item.originalName,
            mimeType: item.mimeType,
            size: item.size,
            uploadedAt: item.uploadedAt,
        }))
        : []

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileInputs = event.target.files
        if (!fileInputs || fileInputs.length === 0) return

        const filesToUpload = Array.from(fileInputs)
        setError(null)

        // Pre-validate all files before starting any uploads
        const validationResults = filesToUpload.map((file) => ({
            file,
            validation: isFileAllowed(file),
        }))

        // Check if any file failed validation
        const failedFile = validationResults.find((result) => !result.validation.allowed)
        if (failedFile) {
            setError(failedFile.validation.error || 'Erro na validação do arquivo')
            // Reset input
            event.target.value = ''
            return
        }

        // Initialize progress tracking only for valid files
        const initialProgress: UploadProgress[] = filesToUpload.map((file) => ({
            fileName: file.name,
            progress: 0,
            status: 'uploading',
        }))
        setUploadProgress(initialProgress)

        // Upload files simultaneously
        const uploadPromises = filesToUpload.map((fileInput, index) =>
            uploadSingleFile(fileInput, index)
        )

        await Promise.all(uploadPromises)

        // Reset input
        event.target.value = ''
    }

    const uploadSingleFile = async (fileInput: File, index: number) => {
        try {
            const formData = new FormData()
            formData.append('file', fileInput)

            const queryParams = new URLSearchParams({
                ...(subdocumentId && { subdocumentId }),
            })

            // Create XHR for progress tracking
            const xhr = new XMLHttpRequest()

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100
                    setUploadProgress((prev) => {
                        const updated = [...prev]
                        updated[index] = {
                            ...updated[index],
                            progress: Math.round(percentComplete),
                        }
                        return updated
                    })
                }
            })

            // Handle completion
            return new Promise<void>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const uploadedFile = JSON.parse(xhr.responseText)
                        if (filesArray) {
                            filesArray.push([uploadedFile])
                        }
                        setUploadProgress((prev) => {
                            const updated = [...prev]
                            updated[index] = {
                                ...updated[index],
                                progress: 100,
                                status: 'success',
                            }
                            return updated
                        })
                        resolve()
                    } else {
                        const errorData = JSON.parse(xhr.responseText)
                        throw new Error(errorData.error || 'Falha no upload')
                    }
                }

                xhr.onerror = () => {
                    const errorMessage = 'Erro ao fazer upload do arquivo'
                    setUploadProgress((prev) => {
                        const updated = [...prev]
                        updated[index] = {
                            ...updated[index],
                            status: 'error',
                            error: errorMessage,
                        }
                        return updated
                    })
                    reject(new Error(errorMessage))
                }

                const url = `/api/documents/${encodeURIComponent(documentId)}/files${queryParams.toString() ? '?' + queryParams.toString() : ''
                    }`
                xhr.open('POST', url)
                xhr.send(formData)
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload'
            setUploadProgress((prev) => {
                const updated = [...prev]
                updated[index] = {
                    ...updated[index],
                    status: 'error',
                    error: errorMessage,
                }
                return updated
            })
        }
    }

    const handleDeleteFileClick = (fileId: string, fileName: string) => {
        setDeleteModal({
            isOpen: true,
            fileId,
            fileName,
        })
    }

    const handleDeleteFileConfirm = async () => {
        if (!deleteModal.fileId) return

        setIsDeleting(true)
        try {
            setError(null)
            const queryParams = new URLSearchParams({
                fileId: deleteModal.fileId,
                fileName: deleteModal.fileName,
                ...(subdocumentId && { subdocumentId }),
            })
            const response = await fetch(
                `/api/documents/${encodeURIComponent(documentId)}/files?${queryParams.toString()}`,
                { method: 'DELETE' }
            )

            if (!response.ok) throw new Error('Falha ao deletar arquivo')

            // Remove from Y-Sweet array
            if (filesArray) {
                const index = files.findIndex((f) => f.id === deleteModal.fileId)
                if (index !== -1) {
                    filesArray.delete(index, 1)
                }
            }

            setDeleteModal({ isOpen: false, fileId: '', fileName: '' })
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Erro ao deletar arquivo'
            )
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteFileCancel = () => {
        setDeleteModal({ isOpen: false, fileId: '', fileName: '' })
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getFileExtension = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toUpperCase()
        return extension || 'ARQUIVO'
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">Arquivos Anexados</h2>

            {/* Upload Input */}
            <label className="relative cursor-pointer mb-4">
                <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadProgress.some((p) => p.status === 'uploading') || !filesArray}
                    className="hidden"
                />
                <span
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${uploadProgress.some((p) => p.status === 'uploading')
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                        }`}
                >
                    {uploadProgress.some((p) => p.status === 'uploading')
                        ? '⏳ Enviando...'
                        : '+ Adicionar Arquivo(s)'}
                </span>
            </label>

            {/* File type and size info */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>Formatos aceitos</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">📄 Office</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.office}</span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">📊 LibreOffice</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.libreoffice}</span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">📑 PDF</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.pdf}</span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">📝 Texto</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.text}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">🖼️ Imagens</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.images}</span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">🎬 Vídeos</span>
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.videos}</span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">📦 Compactado</span><br />
                        <span className="text-slate-600 dark:text-slate-400">{ALLOWED_FORMATS.compressed}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-medium text-slate-700 dark:text-slate-300">📏 Máx: {MAX_FILE_SIZE_MB}MB</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Upload Progress Indicators */}
            {uploadProgress.length > 0 && (
                <div className="mb-4 space-y-2">
                    {uploadProgress.map((upload, index) => (
                        <div
                            key={index}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {upload.fileName}
                                </span>
                                <span
                                    className={`text-xs font-semibold ${upload.status === 'success'
                                        ? 'text-green-600 dark:text-green-400'
                                        : upload.status === 'error'
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                        }`}
                                >
                                    {upload.status === 'success'
                                        ? '✓ Concluído'
                                        : upload.status === 'error'
                                            ? '✕ Erro'
                                            : `${upload.progress}%`}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${upload.status === 'success'
                                        ? 'bg-green-500'
                                        : upload.status === 'error'
                                            ? 'bg-red-500'
                                            : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                            {upload.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                    {upload.error}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!filesArray ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    ⏳ Conectando a Y-Sweet...
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                    Nenhum arquivo anexado ainda. Clique em "Adicionar Arquivo" para começar.
                </div>
            ) : (
                <div className="space-y-2 flex-1 overflow-auto">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <a
                                    href={`/api/documents/${encodeURIComponent(documentId)}/files/download?fileId=${file.id}&fileName=${file.name}&originalName=${encodeURIComponent(file.originalName)}&mimeType=${file.mimeType}&size=${file.size}${subdocumentId ? `&subdocumentId=${subdocumentId}` : ''}`}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate block text-sm"
                                    title={file.originalName}
                                    download
                                >
                                    {file.originalName}
                                </a>
                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-semibold text-slate-700 dark:text-slate-300">
                                        {getFileExtension(file.originalName)}
                                    </span>
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>{formatDate(file.uploadedAt)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteFileClick(file.id, file.originalName)}
                                className="ml-4 p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Deletar arquivo"
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
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                title="Deletar arquivo"
                message="Tem certeza que deseja deletar este arquivo? Esta ação não pode ser desfeita."
                itemName={deleteModal.fileName}
                isLoading={isDeleting}
                onConfirm={handleDeleteFileConfirm}
                onCancel={handleDeleteFileCancel}
            />
        </div>
    )
}
