"use client";

// Suprimir warnings do linkify IMEDIATAMENTE na importação do módulo
// Deve acontecer antes de qualquer componente React montar
const originalWarn = typeof console !== "undefined" ? console.warn : () => { };

if (typeof console !== "undefined") {
    console.warn = function (...args: unknown[]) {
        if (
            args[0] &&
            typeof args[0] === "string" &&
            args[0].includes("linkifyjs")
        ) {
            // Suprimir qualquer warning do linkifyjs
            return;
        }
        originalWarn.apply(console, args);
    };
}

// Patch BroadcastChannel.postMessage to avoid uncaught "Channel is closed" errors
// in browsers (happens during hot reloads or when providers are closed).
if (typeof BroadcastChannel !== "undefined" && BroadcastChannel.prototype) {
    const _origPost = BroadcastChannel.prototype.postMessage;
    try {
        BroadcastChannel.prototype.postMessage = function (msg: unknown) {
            try {
                return _origPost.call(this, msg);
            } catch (err: any) {
                // Ignore errors caused by posting to a closed channel (InvalidStateError)
                // This prevents uncaught exceptions originating from third-party libs.
                if (err && (err.name === "InvalidStateError" || (err.message && err.message.includes("Channel is closed")))) {
                    if (process.env.NODE_ENV !== "production") {
                        // eslint-disable-next-line no-console
                        console.debug("Suppressed BroadcastChannel postMessage to closed channel", err.message || err);
                    }
                    return;
                }
                throw err;
            }
        };
    } catch (e) {
        // If reassigning fails for any reason, silently ignore to avoid breaking the app
    }
}

/**
 * Componente que inicializa linkify uma única vez
 * A supressão já acontece no nível do módulo quando este arquivo é importado
 */
export function LinkifyInit() {
    return null;
}
