"use client";

import { useYDoc, useYjsProvider } from "@y-sweet/react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

export default function DocumentPage() {
    const provider = useYjsProvider();
    const doc = useYDoc();

    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment: doc.getXmlFragment("blocknote"),
            user: { name: "Colaborador", color: "#1f2937" },
        },
    });

    return <BlockNoteView editor={editor} theme="light" />;
}
