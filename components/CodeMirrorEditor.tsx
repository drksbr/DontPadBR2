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
}

export function CodeMirrorEditor({ doc, fragmentKey, provider, user }: CodeMirrorEditorProps) {
    const editorRef = useRef<EditorFromTextArea | null>(null);
    const bindingRef = useRef<CodemirrorBinding | null>(null);

    const codeMirrorRef = useCallback(
        (ref: HTMLTextAreaElement | null) => {
            if (ref == null) {
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
        },
        [doc, fragmentKey, provider, user]
    );

    return (
        <div className="codemirror-editor-container">
            <textarea ref={codeMirrorRef} defaultValue="" />
        </div>
    );
}
