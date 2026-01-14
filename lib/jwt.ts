import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dontpad-secret-key-change-in-production"
);

const COOKIE_NAME = "dp_auth";
const TOKEN_EXPIRY = "24h"; // Token válido por 24 horas

interface DocumentAccessPayload {
  documentId: string;
  iat: number;
  exp: number;
}

/**
 * Gera um JWT para acesso a um documento específico
 */
export async function generateDocumentToken(
  documentId: string
): Promise<string> {
  const token = await new SignJWT({ documentId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifica um JWT e retorna o payload se válido
 */
export async function verifyDocumentToken(
  token: string
): Promise<DocumentAccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as DocumentAccessPayload;
  } catch {
    return null;
  }
}

/**
 * Define o cookie de autenticação para um documento
 */
export async function setDocumentAuthCookie(documentId: string): Promise<void> {
  console.log(`[JWT] Gerando token para documento: ${documentId}`);
  const token = await generateDocumentToken(documentId);
  const cookieStore = await cookies();

  console.log(`[JWT] Definindo cookie de autenticação para: ${documentId}`, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  cookieStore.set(`${COOKIE_NAME}_${documentId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 horas
    path: "/",
  });
}

/**
 * Verifica se o usuário tem acesso a um documento
 */
export async function hasDocumentAccess(documentId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`${COOKIE_NAME}_${documentId}`)?.value;

  if (!token) {
    console.log(`[JWT] Nenhum token encontrado para documento: ${documentId}`);
    return false;
  }

  console.log(`[JWT] Token encontrado para ${documentId}, verificando...`);
  const payload = await verifyDocumentToken(token);
  if (!payload) {
    console.warn(`[JWT] Token inválido para documento: ${documentId}`);
    return false;
  }

  const isValid = payload.documentId === documentId;
  console.log(`[JWT] Acesso verificado para ${documentId}: ${isValid}`);
  return isValid;
}

/**
 * Remove o cookie de autenticação para um documento
 */
export async function clearDocumentAuthCookie(
  documentId: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${COOKIE_NAME}_${documentId}`);
}
