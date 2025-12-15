"use client";

import { DocumentView } from "@/components/DocumentView";
import { useParams } from "next/navigation";

export default function SubdocumentPage() {
    const params = useParams();
    const documentId = params.documentId as string;
    const subdocumentName = params.subdocumentName as string;

    return <DocumentView documentId={documentId} subdocumentName={subdocumentName} />;
}
