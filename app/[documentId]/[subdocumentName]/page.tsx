"use client";

import { useYDoc, useYjsProvider } from "@y-sweet/react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useParams } from "next/navigation";
import { generateSubdocumentFragmentKey } from "@/lib/colors";

export default function SubdocumentPage() {
    const provider = useYjsProvider();
    const doc = useYDoc();
    const params = useParams();
    const documentId = params.documentId as string;
    const subdocumentName = params.subdocumentName as string;

    // Generate deterministic fragment key that includes both document and subdocument info
    const fragmentKey = generateSubdocumentFragmentKey(documentId, subdocumentName);

    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment: doc.getXmlFragment(fragmentKey),
            user: { name: "Colaborador", color: "#1f2937" },
        },
    });

    return <BlockNoteView editor={editor} theme="light" />;
}
