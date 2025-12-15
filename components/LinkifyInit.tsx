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

/**
 * Componente que inicializa linkify uma única vez
 * A supressão já acontece no nível do módulo quando este arquivo é importado
 */
export function LinkifyInit() {
    return null;
}
