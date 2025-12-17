"use client";

import { useCallback, useRef } from "react";
import type { CodemirrorBinding } from "y-codemirror";
import type { EditorFromTextArea } from "codemirror";
import * as Y from "yjs";

import "codemirror/lib/codemirror.css";
if (typeof navigator !== "undefined") {
    // This accesses the global navigator, which is not available in SSR,
    // so we guard the import.
    require("codemirror/mode/markdown/markdown");
}
import "./CodeMirrorEditor.css";

interface CodeMirrorEditorProps {
    doc: Y.Doc;
    fragmentKey: string;
    // Provider to get awareness for collaborative cursors
    provider?: any;
    // Optional display info for local user (name/color)
    user?: { name: string; color: string };
    onFocus?: () => void;
    onBlur?: () => void;
}

export function CodeMirrorEditor({ doc, fragmentKey, provider, user, onFocus, onBlur }: CodeMirrorEditorProps) {
    const editorRef = useRef<EditorFromTextArea | null>(null);
    const bindingRef = useRef<CodemirrorBinding | null>(null);

    const codeMirrorRef = useCallback(
        (ref: HTMLTextAreaElement | null) => {
            if (ref == null) {
                // eslint-disable-next-line no-console
                console.debug("CodeMirror: ref cleared, destroying editor/binding");
                if (editorRef.current != null) {
                    editorRef.current.toTextArea();
                    editorRef.current = null;
                }

                if (bindingRef.current != null) {
                    bindingRef.current.destroy();
                    bindingRef.current = null;
                }

                return;
            }

            if (bindingRef.current !== null) {
                return;
            }

            // These libraries are designed to work in the browser, and will cause warnings
            // if imported on the server. Nextjs renders components on both the server and
            // the client, so we import them lazily here when they are used on the client.
            const CodeMirror = require("codemirror");
            const CodemirrorBinding = require("y-codemirror").CodemirrorBinding;

            // Get or create the Y.Text for the document
            const yText = doc.getText(fragmentKey);

            editorRef.current = CodeMirror.fromTextArea(ref, {
                lineNumbers: true,
                mode: "markdown",
                lineWrapping: true,
                theme: "default",
                placeholder: "Comece a escrever...",
            });

            // Debug focus/blur to help diagnose focus loss issues
            try {
                const ed = editorRef.current;
                if (ed) {
                    ed.on("focus", () => {
                        // eslint-disable-next-line no-console
                        console.debug("CodeMirror: focus");
                        onFocus?.();
                    });
                    ed.on("blur", () => {
                        // eslint-disable-next-line no-console
                        console.debug("CodeMirror: blur");
                        onBlur?.();
                    });
                    try {
                        ed.on("keydown", (cm: any, ev: any) => {
                            // eslint-disable-next-line no-console
                            console.debug("CodeMirror: keydown", { key: ev.key, cm: !!cm });
                        });
                    } catch (e) {
                        // ignore
                    }
                }
            } catch (e) {
                // ignore if editor doesn't support events
            }

            // Pass awareness to CodemirrorBinding to enable remote cursors
            const awareness = provider?.awareness;

            if (awareness && user) {
                try {
                    // set local user info used by many awareness-based cursors
                    awareness.setLocalStateField?.("user", user);
                } catch (e) {
                    console.error("Error setting awareness:", e);
                }
            }

            bindingRef.current = new CodemirrorBinding(yText, editorRef.current, awareness);
            // Log binding creation
            // eslint-disable-next-line no-console
            console.debug("CodeMirror: binding created", { fragmentKey });

            // Log when CodeMirror is about to be removed (clean up)
            // We already handle destruction on ref clear, but add more visibility
            // by listening to the underlying textarea's parent being removed via MutationObserver.
            try {
                const node = ref.parentElement;
                if (node && typeof MutationObserver !== "undefined") {
                    const mo = new MutationObserver((mutations) => {
                        mutations.forEach((m) => {
                            m.removedNodes.forEach((n) => {
                                if (n === node) {
                                    // eslint-disable-next-line no-console
                                    console.debug("CodeMirror: container removed from DOM");
                                }
                            });
                        });
                    });
                    mo.observe(node.parentNode || document.body, { childList: true });
                }
            } catch (e) {
                // ignore
            }
        },
        [doc, fragmentKey, provider, user]
    );

    // Log mount/unmount of this component
    // (helps diagnose focus issues caused by remounting)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (function useMountLogger() {
        // Use a micro effect-like pattern inside a client component safely
        try {
            // eslint-disable-next-line no-console
            console.debug("CodeMirrorEditor: render (mount check)");
        } catch (e) { }
    })();

    return (
        <div
            className="codemirror-editor-container"
            onPointerDown={(e) => {
                // Stop propagation to avoid ancestor handlers stealing focus
                e.stopPropagation();
                // Do NOT preventDefault here: it can interfere with CodeMirror's internal handling.
                // Ensure editor gets focus after the pointerdown
                setTimeout(() => editorRef.current?.focus(), 0);
                // eslint-disable-next-line no-console
                console.debug("CodeMirror container: pointerdown");
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <textarea ref={codeMirrorRef} defaultValue="" />
        </div>
    );
}
