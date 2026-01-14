import { DocumentManager } from "@y-sweet/sdk";
import { sanitizeDocumentId } from "@/lib/colors";
import { SecureDocumentProvider } from "@/components/SecureDocumentProvider";
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
        // Try to obtain a client token from the configured Y-Sweet manager.
        // Provide a clearer error message if the call fails (e.g. when the Y-Sweet
        // server is not reachable or CONNECTION_STRING is misconfigured).
        try {
            const token = await manager.getOrCreateDocAndToken(sanitizedId);
            return fixWebSocketUrl(token);
        } catch (err: any) {
            // Attempt a simple fallback check: if the CONNECTION_STRING looks like
            // it's pointing to the internal docker host (ys://ysweet:8080) but the
            // developer is running locally without Docker, suggest using localhost.
            const conn = process.env.CONNECTION_STRING;
            const suggestion = conn && conn.includes("ysweet") ? "Try setting CONNECTION_STRING=ys://127.0.0.1:8080 when running locally, or start the Y-Sweet server." : "Ensure your CONNECTION_STRING points to a running Y-Sweet instance and that it is reachable from this server.";
            console.error("Failed to get client token from Y-Sweet", err);

            // Try a TCP probe to provide a clearer diagnostic when possible
            try {
                const m = conn?.match(/^ys:\/\/(.+?):(\d+)/);
                if (m) {
                    const host = m[1];
                    const port = parseInt(m[2], 10);
                    // Use Node net to attempt a quick connect
                    const net = await import("net");
                    await new Promise<void>((resolve, reject) => {
                        const s = new net.Socket();
                        const timeout = 2000;
                        const onError = (e: any) => {
                            s.destroy();
                            reject(e);
                        };
                        s.setTimeout(timeout, () => onError(new Error("timeout")));
                        s.once("error", onError);
                        s.connect(port, host, () => {
                            s.end();
                            resolve();
                        });
                    });
                }
            } catch (probeErr) {
                console.debug("Y-Sweet probe failed:", probeErr instanceof Error ? probeErr.message : probeErr);
            }
            // If the connection string uses the docker hostname 'ysweet', and
            // we are running locally (no docker network), try the localhost
            // fallback automatically before giving up.
            try {
                if (conn && conn.includes("ysweet")) {
                    console.debug("Attempting fallback to ys://127.0.0.1:8080");
                    const { DocumentManager } = await import("@y-sweet/sdk");
                    const fallbackManager = new DocumentManager("ys://127.0.0.1:8080");
                    const token = await fallbackManager.getOrCreateDocAndToken(sanitizedId);
                    return fixWebSocketUrl(token);
                }
            } catch (fallbackErr) {
                console.debug("Y-Sweet fallback failed:", fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
            }

            throw new Error(
                "Failed to get client token from Y-Sweet: " +
                (err?.message || String(err)) +
                " - " +
                suggestion
            );
        }
    }

    return (
        <SecureDocumentProvider documentId={sanitizedId} authEndpoint={getClientToken}>
            {children}
        </SecureDocumentProvider>
    );
}
