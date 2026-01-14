"use client";

import { DocumentView } from "@/components/DocumentView";
import { useParams } from "next/navigation";

export default function DocumentPage() {
    const params = useParams();
    const documentId = params.documentId as string;

    return <DocumentView documentId={documentId} />;
}