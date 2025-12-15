import { DocumentManager } from "@y-sweet/sdk";
import { YDocProvider } from "@y-sweet/react";
import { sanitizeDocumentId } from "@/lib/colors";

const manager = new DocumentManager(
    process.env.CONNECTION_STRING || "ys://127.0.0.1:8080",
);

interface DocumentLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        documentId: string;
    }>;
}

// Disable static generation for this route since documents are dynamic
export const dynamic = "force-dynamic";

export default async function DocumentLayout({
    children,
    params
}: DocumentLayoutProps) {
    const { documentId } = await params;
    const sanitizedId = sanitizeDocumentId(decodeURIComponent(documentId));

    async function getClientToken() {
        "use server";
        return await manager.getOrCreateDocAndToken(sanitizedId);
    }

    return (
        <YDocProvider docId={sanitizedId} authEndpoint={getClientToken} showDebuggerLink={false} offlineSupport={true}>
            {children}
        </YDocProvider>
    );
}
