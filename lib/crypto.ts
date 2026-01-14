/**
 * Utilitários de criptografia para o DontPad
 *
 * IMPORTANTE: Usa APENAS crypto.subtle SHA-256 para garantir consistência
 * entre ambientes de desenvolvimento e produção. Não há fallback.
 */

// Versão do frontend
export const APP_VERSION = "V0.1.1";

/**
 * Gera um hash SHA-256 do PIN fornecido.
 * Usa crypto.subtle para garantir consistência entre dev e produção.
 *
 * @param pin - O PIN a ser hasheado
 * @returns Promise com o hash em formato hexadecimal
 * @throws Error se crypto.subtle não estiver disponível
 */
export async function hashPin(pin: string): Promise<string> {
  // crypto.subtle é obrigatório para garantir consistência
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Ambiente inseguro: crypto.subtle não disponível. " +
        "A proteção por PIN requer HTTPS em produção ou localhost em desenvolvimento."
    );
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifica se o ambiente suporta criptografia segura (crypto.subtle)
 * @returns true se crypto.subtle está disponível
 */
export function isSecureCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}
