# Migração: Removendo Dependency do documents.json

## Resumo da Migração

O projeto foi migrado para usar **Y-Sweet como única fonte de verdade** para metadados de subdocumentos e arquivos. O arquivo `documents.json` não é mais necessário.

## Mudanças Realizadas

### 1. **lib/db.ts** - Refatoração completa
- **Subdocumentos**: Agora gerenciados via `Y.Map 'subdocuments'` no Y-Sweet
  - `getSubdocuments()` retorna array vazio (dados vêm do Y-Sweet)
  - `addSubdocument()` apenas retorna o objeto como acknowledgment
  - `deleteSubdocument()` retorna true como acknowledgment
  
- **Arquivos**: Gerenciados via `Y.Array 'files'` no Y-Sweet
  - `getDocumentFiles()` retorna array vazio (dados vêm do Y-Sweet)
  - `addFileToDocument()` apenas retorna o arquivo como acknowledgment
  - `deleteDocumentFile()` retorna true como acknowledgment
  
- **Upload Directory**: Mantido, apenas operações de filesystem

### 2. **app/api/documents/[documentId]/subdocuments/route.ts**
- GET: Retorna array vazio (deprecated)
- POST: Sanitiza nome e retorna objeto
- DELETE: Apenas acknowledges (sem ler JSON)
- Comentários explicam que operações reais acontecem no Y-Sweet

### 3. **app/api/documents/[documentId]/files/route.ts**
- GET: Retorna array vazio (deprecated)
- POST: Upload para disco, retorna metadata (sem salvar em JSON)
- DELETE: Remove arquivo do disco, sem consultar JSON
- Usa query params para informações do arquivo

### 4. **app/api/documents/[documentId]/files/download/route.ts**
- Recebe metadata via query params (fileId, fileName, mimeType, size, originalName)
- Não precisa ler JSON para buscar arquivo

### 5. **components/SubdocumentManager.tsx**
- Agora usa `useMap('subdocuments')` do Y-Sweet React
- Adiciona diretamente ao Y.Map via `subdocsMap.set()`
- Deleta via `subdocsMap.delete()`
- Sem chamadas para API (exceto POST/DELETE para protocol compatibility)
- **Real-time sync automático** quando Y-Sweet atualiza

### 6. **components/FileManager.tsx**
- Agora usa `useArray()` do Y-Sweet React
- Para doc-level files: `useArray('files')`
- Para subdoc files: `useArray('subdocuments.${id}.files')`
- Adiciona ao array via `filesArray.push()`
- Deleta via `filesArray.delete()`
- Upload ainda vai para API, mas metadata é sincronizado via Y-Sweet

## Estrutura Y-Sweet Esperada

```javascript
{
  // Conteúdo principal
  "text": Y.Text,
  
  // Subdocumentos
  "subdocuments": Y.Map {
    "subdoc-id": {
      "id": string,
      "name": string,
      "createdAt": number,
      "files": Y.Array [...]
    }
  },
  
  // Arquivos do documento raiz
  "files": Y.Array [
    {
      "id": uuid,
      "name": "filename.ext",
      "originalName": "Original Name.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "uploadedAt": timestamp
    }
  ]
}
```

## Comportamento de Sincronização

### Subdocumentos
1. Cliente cria subdocumento via `SubdocumentManager`
2. Adiciona ao `Y.Map 'subdocuments'` localmente
3. Y-Sweet sincroniza com outros clientes automaticamente
4. Componente renderiza novo subdocumento via hook

### Arquivos
1. Cliente faz upload via `FileManager`
2. Arquivo é salvo no disk do servidor (endpoint POST)
3. Metadata é retornado e adicionado ao `Y.Array`
4. Y-Sweet sincroniza com outros clientes
5. Componente renderiza novo arquivo via hook

### Deletar
1. Cliente deleta via UI
2. Remove do Y.Map/Y.Array localmente
3. Faz request DELETE para limpar arquivo do disk
4. Y-Sweet sincroniza deleção com outros clientes

## Por que isso é melhor?

✅ **Sem arquivo JSON**: Sem duplicação de dados
✅ **Real-time**: Todos os clientes veem mudanças instantaneamente
✅ **CRDT conflicts**: Y-Sweet resolve automáticamente conflitos de edição
✅ **Menos API calls**: Sincronização acontece via WebSocket, não polling
✅ **Transacional**: Mudanças em subdocs + files são atômicas
✅ **Simpler code**: Menos lógica de persistência

## Notas de Implementação

- O `documents.json` pode ser deletado manualmente após confirmar funcionalidade
- APIs mantêm compatibilidade (POST/DELETE endpoints existem)
- Clientes precisam usar hooks Y-Sweet para dados em tempo real
- Upload de arquivo ainda usa HTTP (Y-Sweet não é para binários grandes)
- Metadados de arquivo ficam no Y-Sweet, binário no disco

## Possíveis Melhorias Futuras

1. Compressão automática de subdocumentos antigos
2. Limpeza automática de arquivos órfãos
3. Versionamento de subdocumentos via Y-Sweet history
4. Quotas por documento
