/**
 * Utilitários de criptografia para o DontPad
 *
 * IMPORTANTE: Usa SHA-256 com suporte a browser (crypto.subtle) e servidor Node.js (crypto.createHash)
 * Garantindo consistência entre ambientes de desenvolvimento e produção.
 */

// Versão do frontend
export const APP_VERSION = "V0.1.1";

/**
 * Gera um hash SHA-256 do PIN fornecido.
 * Funciona em browser (crypto.subtle) e servidor Node.js (crypto.createHash)
 *
 * @param pin - O PIN a ser hasheado
 * @returns Promise com o hash em formato hexadecimal
 */
export async function hashPin(pin: string): Promise<string> {
  // Ambiente do browser com crypto.subtle
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Ambiente do servidor Node.js
  if (typeof require !== "undefined") {
    // Dynamic import para evitar erro em environments sem Node.js
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(pin).digest("hex");
  }

  throw new Error(
    "Ambiente não suportado: Nem crypto.subtle (browser) nem Node.js crypto disponíveis."
  );
}

/**
 * Verifica se o ambiente suporta criptografia segura (crypto.subtle)
 * @returns true se crypto.subtle está disponível
 */
export function isSecureCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}
