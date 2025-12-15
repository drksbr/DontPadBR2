import { DocumentManager } from "@y-sweet/sdk";
import { YDocProvider } from "@y-sweet/react";
import { sanitizeDocumentId } from "@/lib/colors";
import type { ClientToken } from "@y-sweet/sdk";

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

// Corrige a URL do WebSocket para usar wss:// quando necessário
// O Y-Sweet retorna ws:// mesmo quando configurado com wss://
function fixWebSocketUrl(token: ClientToken): ClientToken {
    if (token.url && token.url.startsWith("ws://") && token.baseUrl?.startsWith("wss://")) {
        return {
            ...token,
            url: token.url.replace("ws://", "wss://"),
        };
    }
    return token;
}

export default async function DocumentLayout({
    children,
    params
}: DocumentLayoutProps) {
    const { documentId } = await params;
    const sanitizedId = sanitizeDocumentId(decodeURIComponent(documentId));

    async function getClientToken() {
        "use server";
        const token = await manager.getOrCreateDocAndToken(sanitizedId);
        return fixWebSocketUrl(token);
    }

    return (
        <YDocProvider docId={sanitizedId} authEndpoint={getClientToken} showDebuggerLink={false} offlineSupport={true}>
            {children}
        </YDocProvider>
    );
}
