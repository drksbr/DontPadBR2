/**
 * Utilitários de criptografia para o DontPad
 * Suporta ambientes com e sem crypto.subtle (HTTPS vs HTTP)
 */

/**
 * Gera um hash SHA-256 do PIN fornecido.
 * Usa crypto.subtle quando disponível (HTTPS/localhost),
 * com fallback para hash simples em HTTP não seguro.
 *
 * @param pin - O PIN a ser hasheado
 * @returns Promise com o hash em formato hexadecimal
 */
export async function hashPin(pin: string): Promise<string> {
  // Verifica se crypto.subtle está disponível (requer HTTPS ou localhost)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback para ambientes sem crypto.subtle (HTTP não seguro)
  // Usa um hash simples baseado em string - menos seguro, mas funcional
  console.warn(
    "[DontPad] crypto.subtle não disponível. " +
      "Para maior segurança, use HTTPS ou localhost."
  );

  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Adiciona identificador e converte para hex
  const saltedHash = Math.abs(hash).toString(16).padStart(8, "0");
  return `fallback_${saltedHash}_${pin.length}`;
}

/**
 * Verifica se o ambiente suporta criptografia segura (crypto.subtle)
 * @returns true se crypto.subtle está disponível
 */
export function isSecureCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}
