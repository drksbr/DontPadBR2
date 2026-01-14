'use client'

import { useText, useAwareness } from '@y-sweet/react'
import { useEffect, useRef } from 'react'
import { QuillBinding } from 'y-quill'
import 'quill/dist/quill.bubble.css'

interface TextEditorProps {
    documentId?: string
    subdocumentName?: string
}

export function TextEditor({ documentId, subdocumentName }: TextEditorProps) {
    // Generate a unique key for this document/subdocument combination
    // Main document uses 'text'
    // Subdocuments use 'text:subdocname' to keep Y.Text instances separate
    const textKey = subdocumentName
        ? `text:${subdocumentName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")}`
        : 'text'

    const yText = useText(textKey, { observe: 'none' })
    const awareness = useAwareness()
    const editorRef = useRef<HTMLDivElement | null>(null)
    const bindingRef = useRef<QuillBinding | null>(null)

    useEffect(() => {
        if (bindingRef.current !== null) {
            return
        }

        if (editorRef.current && awareness && yText) {
            // These libraries are designed to work in the browser, and will cause
            // warnings if imported on the server. Nextjs renders components on both the server
            // and the client, so we import them lazily here when they are used on the
            // client.
            const Quill = require('quill').default || require('quill')
            const QuillCursors = require('quill-cursors').default || require('quill-cursors')
            Quill.register('modules/cursors', QuillCursors)

            const quill = new Quill(editorRef.current, {
                theme: 'bubble',
                placeholder: 'Comece a escrever...',
                modules: {
                    cursors: true,
                    toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                    ],
                },
            })

            bindingRef.current = new QuillBinding(yText!, quill, awareness!)

            // Add click handler for links
            editorRef.current?.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement
                if (target.tagName === 'A' && target.hasAttribute('href')) {
                    const href = target.getAttribute('href')
                    if (href) {
                        const event = e as MouseEvent
                        if (event.ctrlKey || event.metaKey || event.button === 1) {
                            window.open(href, '_blank')
                        } else {
                            window.open(href, '_blank')
                        }
                    }
                }
            })

            // Flag to prevent infinite loops
            let isUpdatingArrows = false

            // Add arrow icon to links after text changes
            quill.on('text-change', () => {
                if (isUpdatingArrows) return

                setTimeout(() => {
                    isUpdatingArrows = true
                    const links = editorRef.current?.querySelectorAll('a:not([data-arrow-added])')
                    links?.forEach((link) => {
                        // Add new arrow only if not already added
                        if (!link.hasAttribute('data-arrow-added')) {
                            const arrow = document.createElement('span')
                            arrow.className = 'link-arrow'
                            arrow.textContent = ' ↗'
                            link.appendChild(arrow)
                            link.setAttribute('data-arrow-added', 'true')
                        }
                    })
                    isUpdatingArrows = false
                }, 0)
            })
        }
    }, [yText, awareness])

    return (
        <>
            <style jsx global>{`
                .ql-tooltip {
                    z-index: 50 !important;
                }
                .ql-container {
                    overflow: visible !important;
                }
                .ql-color, .ql-background {
                    width: 28px !important;
                }
                .ql-color .ql-picker-label::before,
                .ql-background .ql-picker-label::before {
                    border-radius: 3px;
                }
                .ql-picker-options {
                    padding: 8px 4px;
                }
                .ql-color-label, .ql-background-label, .ql-align .ql-picker-label {
                    font-size: 12px;
                }
                /* Link styling */
                .ql-editor a {
                    color: #2563eb;
                    text-decoration: underline;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                .ql-editor a:hover {
                    color: #1d4ed8;
                }
                .ql-editor a:hover .link-arrow {
                    opacity: 1 !important;
                }
                .dark .ql-editor a {
                    color: #60a5fa;
                }
                .dark .ql-editor a:hover {
                    color: #93c5fd;
                }
            `}</style>
            <div className="h-full w-full md:max-w-7xl md:mx-auto md:px-6 md:py-4 flex flex-col">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative">
                    <div ref={editorRef} className="h-full overflow-auto" />
                </div>
            </div>
        </>
    )
}
