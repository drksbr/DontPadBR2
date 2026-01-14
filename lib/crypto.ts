import bcrypt from "bcryptjs";

/**
 * Utilitários de criptografia para o DontPad
 *
 * IMPORTANTE: Usa bcryptjs para máxima compatibilidade entre browser e servidor
 * Funciona identicamente em ambos os ambientes
 */

// Versão do frontend
export const APP_VERSION = "V0.1.1";

// Constante de log para debug
const DEBUG =
  typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";
const LOG_PREFIX = "[DontPad-Crypto]";

/**
 * Gera um hash bcrypt do PIN fornecido.
 * Usa bcryptjs que funciona identicamente em browser e servidor Node.js.
 *
 * @param pin - O PIN a ser hasheado
 * @returns Promise com o hash bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    if (!pin || typeof pin !== "string") {
      throw new Error("PIN inválido");
    }

    // bcryptjs funciona em browser e servidor
    const hash = await bcrypt.hash(pin, 10);

    if (DEBUG) {
      console.log(
        `${LOG_PREFIX} Hash gerado para PIN de ${pin.length} caracteres:`,
        hash.substring(0, 20) + "..."
      );
    }

    return hash;
  } catch (error) {
    console.error(`${LOG_PREFIX} Erro ao fazer hash do PIN:`, error);
    throw error;
  }
}

/**
 * Verifica se um PIN corresponde a um hash bcrypt.
 * Usa bcryptjs que funciona identicamente em browser e servidor Node.js.
 *
 * @param pin - O PIN para verificar
 * @param hash - O hash bcrypt armazenado
 * @returns Promise com true se corresponde, false caso contrário
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    if (!pin || typeof pin !== "string") {
      if (DEBUG) {
        console.warn(`${LOG_PREFIX} PIN inválido fornecido para verificação`);
      }
      return false;
    }

    if (!hash || typeof hash !== "string") {
      if (DEBUG) {
        console.warn(`${LOG_PREFIX} Hash inválido para verificação`);
      }
      return false;
    }

    if (DEBUG) {
      console.log(
        `${LOG_PREFIX} Verificando PIN de ${pin.length} caracteres contra hash:`,
        hash.substring(0, 20) + "..."
      );
    }

    const isValid = await bcrypt.compare(pin, hash);

    if (DEBUG) {
      console.log(`${LOG_PREFIX} Resultado da verificação:`, isValid);
    }

    return isValid;
  } catch (error) {
    console.error(`${LOG_PREFIX} Erro ao verificar PIN:`, error);
    // Retorna false em caso de erro ao invés de lançar exceção
    return false;
  }
}

/**
 * Verifica se o ambiente suporta criptografia (bcryptjs funciona em todos)
 * @returns true (sempre true com bcryptjs)
 */
export function isSecureCryptoAvailable(): boolean {
  return true; // bcryptjs funciona em todos ambientes
}
