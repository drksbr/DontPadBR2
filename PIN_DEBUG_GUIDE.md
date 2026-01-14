# Guia de Debug: Proteção por PIN

## Problema Identificado

A proteção por PIN funciona em desenvolvimento mas não em produção.

## Hipóteses

1. **Problema com cookies**: Os cookies JWT não estão sendo salvos/lidos corretamente em produção
2. **Problema com Yjs**: O hash do PIN não está sendo salvo corretamente no Y-Sweet
3. **Problema com bcryptjs**: A verificação bcrypt não está funcionando corretamente em produção

## Como Debugar

### 1. Verificar os Logs do Servidor

No terminal onde o servidor está rodando, procure por mensagens com esses prefixos:

```
[JWT]        - Logs do sistema de autenticação JWT
[Security]   - Logs da rota /api/documents/[documentId]/security
[VerifyPIN]  - Logs da verificação de PIN
[Crypto]     - Logs da criptografia bcryptjs
```

### 2. Verificar os Logs do Browser (F12)

Procure por:

```
[SecureDocumentProvider]  - Logs do componente que verifica acesso
[PasswordProtection]      - Logs da tela de PIN
```

### 3. Fluxo Completo de Verificação

#### Ao abrir um documento protegido:

1. `SecureDocumentProvider.checkSecurity()` é chamado
2. Browser faz request para `/api/documents/[documentId]/security`
3. Server logs:
   - `[Security] Verificando acesso para documento: XXX`
   - `[JWT] Nenhum token encontrado para documento: XXX` (primeira vez)
   - `[Security] Documento XXX: { isProtected: true, hasPasswordHash: true, hasAccess: false, ...}`
4. Browser recebe resposta e mostra tela de PIN

#### Ao submeter PIN:

1. Browser submete PIN para `/api/documents/[documentId]/verify-pin`
2. Server logs:
   - `[VerifyPIN] Verificando PIN para documento: XXX`
   - `[VerifyPIN] Hash armazenado encontrado: $2a$10$...`
   - `[VerifyPIN] Comparando PIN com hash usando bcrypt`
   - `[VerifyPIN] PIN verificado com sucesso! Gerando JWT` (se correto)
3. Server chama `setDocumentAuthCookie()` e logs:
   - `[JWT] Gerando token para documento: XXX`
   - `[JWT] Definindo cookie de autenticação para: XXX`
4. Browser recebe resposta com `success: true`
5. Browser chama `checkSecurity()` novamente
6. Server logs:
   - `[JWT] Token encontrado para XXX, verificando...`
   - `[JWT] Acesso verificado para XXX: true`
   - `[Security] Resposta final para XXX: { isProtected: true, hasAccess: true }`
7. Documento carrega normalmente

## O que Procurar em Produção

### Logs Esperados (Sucesso)

```
[Security] Verificando acesso para documento: my-doc
[JWT] Nenhum token encontrado para documento: my-doc
[Security] Documento my-doc: { isProtected: true, hasPasswordHash: true, hasAccess: false }
[VerifyPIN] Verificando PIN para documento: my-doc
[VerifyPIN] Hash armazenado encontrado: $2a$10$...
[VerifyPIN] PIN verificado com sucesso! Gerando JWT
[JWT] Gerando token para documento: my-doc
[JWT] Definindo cookie de autenticação para: my-doc
[JWT] Token encontrado para my-doc, verificando...
[JWT] Acesso verificado para my-doc: true
```

### Logs de Erro Comuns

#### "Documento não tem hash de proteção"

```
[Security] Documento my-doc: { isProtected: true, hasPasswordHash: false }
[VerifyPIN] Documento não tem hash de proteção
```

**Causa**: O hash não foi salvo corretamente ao proteger o documento
**Solução**: Proteça o documento novamente

#### "PIN incorreto" em todas as tentativas

```
[VerifyPIN] PIN verificado com sucesso! → false
```

**Causa**: O hash armazenado é diferente do esperado, ou o bcryptjs não está funcionando
**Solução**: Verifique se bcryptjs está corretamente instalado em produção

#### Cookie não está sendo lido

```
[JWT] Nenhum token encontrado para documento: my-doc (sempre, mesmo após PIN correto)
```

**Causa**: Cookies não estão sendo saltos corretamente
**Possíveis razões em produção**:

- `secure: true` mas não é HTTPS
- `sameSite: strict` está bloqueando
- Domain/path incorretos

## Comandos para Testar Manualmente

### 1. Proteger um documento (em desenvolvimento)

```bash
# Abra o dev tools, vá para a aba de Configurações do documento
# e configure um PIN (ex: 1234)
```

### 2. Verificar se o PIN foi salvo

```bash
# No console do browser
fetch('/api/documents/my-doc/security')
  .then(r => r.json())
  .then(console.log)
```

Se retornar:

```json
{ "isProtected": true, "hasAccess": false }
```

Significa que o PIN foi salvo corretamente.

### 3. Testar verificação do PIN

```bash
fetch('/api/documents/my-doc/verify-pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pin: '1234' })
})
  .then(r => r.json())
  .then(console.log)
```

Se retornar `{ "success": true }`, o PIN está sendo verificado corretamente.

## Próximos Passos

1. **Colete os logs completos do servidor quando o problema ocorrer**
2. **Compartilhe os logs com o prefixo `[JWT]`, `[Security]`, `[VerifyPIN]` e `[Crypto]`**
3. **Indique qual versão do bcryptjs está instalada**: `bun ls | grep bcryptjs`
4. **Confirme se é produção ou localhost**
5. **Verifique o NODE_ENV em produção**
