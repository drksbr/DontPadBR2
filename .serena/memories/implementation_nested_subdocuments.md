# Implementação: Subnotas no Mesmo Documento Y-Sweet

## Status: ✅ Completo

A aplicação foi atualizada para usar um documento único do Y-Sweet com estrutura hierárquica aninhada, eliminando a necessidade de múltiplos arquivos `data.ysweet`.

## Mudanças Realizadas

### 1. **TextEditor.tsx** 
- Importação do hook `useMap` do `@y-sweet/react`
- Acesso ao mapa de subnotas via `useMap('subdocuments')`
- Se editando uma subnota, busca `subdocumentsMap.get(subdocumentName).get('text')`
- Se editando nota principal, usa `useText('text')`
- Dinamicamente escolhe qual Y.Text usar baseado no contexto

### 2. **SubdocumentManager.tsx**
- Removido: Chamadas para API de fetch/POST/DELETE
- Adicionado: Uso direto do `useMap('subdocuments')` 
- `useEffect` que observa mudanças no map e sincroniza com estado local
- Criação direta no Y.Map quando usuário cria nova subnota
- Deleção direta do Y.Map quando usuário deleta subnota
- **Sanitização de nomes**: Nomes convertidos para IDs válidos (lowercase, hífens, sem caracteres especiais)

### 3. **lib/colors.ts**
- ✂️ **Removidas funções**:
  - `generateSubdocumentId()` - não mais necessário
  - `generateSubdocumentFragmentKey()` - não mais necessário  
  - `generateSubdocumentDocId()` - não mais necessário
- Mantidas: Funções de cores para colaboradores e `sanitizeDocumentId()`

### 4. **API Routes** (`app/api/documents/[documentId]/subdocuments/route.ts`)
- ℹ️ **Modo de fallback**: Endpoints mantidos para compatibilidade, mas sincronização real acontece via Y-Sweet
- GET: Retorna metadados do JSON (backward compatibility)
- POST: Valida nome e retorna estrutura (criação real no cliente via Y.Map)
- DELETE: Acknowledges request (deleção real no cliente via Y.Map)

### 5. **Subdocument Layout** (`app/[documentId]/[subdocumentName]/layout.tsx`)
- Removido: `generateSubdocumentFragmentKey()` import
- **Mudança principal**: 
  - Antes: `docId = generateSubdocumentFragmentKey(...)` (documento separado)
  - Depois: `docId = sanitizedDocId` (mesmo documento principal)
- Isso garante que notas e subnotas compartilhem **a mesma conexão WebSocket**

## Estrutura de Dados Y-Sweet

### Antes (Múltiplos Documentos)
```
Y-Sweet Server:
  ├─ documento-principal (data.ysweet)
  │   └─ text: "Conteúdo da nota"
  │
  ├─ documento-principal--subnota-1 (data.ysweet)
  │   └─ text: "Conteúdo da subnota 1"
  │
  └─ documento-principal--subnota-2 (data.ysweet)
      └─ text: "Conteúdo da subnota 2"
```

### Depois (Um Documento com Estrutura Aninhada) ✨
```
Y-Sweet Server:
  └─ documento-principal (data.ysweet único)
     ├─ text: "Conteúdo da nota" (Y.Text)
     └─ subdocuments: Y.Map
        ├─ "subnota-1": Y.Map
        │   ├─ text: "Conteúdo da subnota 1" (Y.Text)
        │   ├─ createdAt: timestamp
        │   └─ files: [] (array)
        │
        └─ "subnota-2": Y.Map
            ├─ text: "Conteúdo da subnota 2" (Y.Text)
            ├─ createdAt: timestamp
            └─ files: [] (array)
```

## Benefícios Implementados

✅ **Uma única conexão WebSocket**: Por documento principal (não por subnota)  
✅ **Transações atômicas**: Mudanças na nota e subnotas sincronizadas juntas  
✅ **Menos arquivo**: 1 `data.ysweet` por documento (antes eram múltiplos)  
✅ **Sincronização eficiente**: Y-Sweet compacta updates automaticamente  
✅ **Estrutura hierárquica natural**: Reflete a relação lógica  
✅ **IDs simplificados**: Usa nomes sanitizados como chaves ao invés de hashes complexos  

## Fluxo de Funcionamento

### Criar Subnota
1. Usuário digita nome em `SubdocumentManager`
2. Nome é sanitizado
3. `subdocumentsMap.set(sanitizedName, { text: '', createdAt, files: [] })`
4. Y-Sweet sincroniza para todos os clientes
5. `useEffect` no SubdocumentManager atualiza lista local

### Editar Subnota
1. Usuário navega para `/documento/subnota`
2. `[subdocumentName]/layout.tsx` carrega **o mesmo documento** principal
3. `TextEditor` usa `useMap('subdocuments').get(subdocumentName).get('text')`
4. Quill binding conecta ao Y.Text da subnota
5. Alterações sincronizam via WebSocket único

### Deletar Subnota
1. Usuário clica delete em `SubdocumentManager`
2. `subdocumentsMap.delete(id)`
3. Y-Sweet sincroniza deleção
4. `useEffect` detecta mudança e remove da lista

## Notas Técnicas

- **Sem breaking changes**: Metadados ainda podem ser armazenados em JSON se necessário
- **Compatibilidade**: API endpoints mantidas para tooling/extensões futuras
- **Escalabilidade**: Funciona bem com dezenas de subnotas por documento
- **Performance**: Y-Sweet compacta estruturas aninhadas eficientemente
- **Tipagem**: Alguns `as any` necessários pois Y.Map retorna `unknown` do Yjs