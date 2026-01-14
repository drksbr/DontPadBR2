# Funcionalidade de Upload de Arquivos - DontPadBR2

## Visão Geral
Adicionada funcionalidade completa de upload de arquivos vinculados a documentos e subdocumentos no DontPadBR2.

## Arquivos Modificados/Criados

### 1. **lib/types.ts** (MODIFICADO)
- Adicionada interface `DocumentFile` com campos:
  - `id`: UUID único do arquivo
  - `name`: Nome armazenado (UUID + extensão)
  - `originalName`: Nome original do arquivo
  - `mimeType`: Tipo MIME do arquivo
  - `size`: Tamanho em bytes
  - `uploadedAt`: Timestamp do upload

- Atualizado `Subdocument` interface com campo opcional `files: DocumentFile[]`
- Atualizado `DocumentMetadata` interface com campo opcional `files: DocumentFile[]`

### 2. **lib/db.ts** (MODIFICADO)
Adicionadas novas funções:
- `getDocumentUploadsDir()`: Retorna caminho do diretório de uploads para um documento/subdocumento
- `addFileToDocument()`: Adiciona metadados de arquivo ao banco de dados
- `getDocumentFiles()`: Recupera lista de arquivos de um documento/subdocumento
- `deleteDocumentFile()`: Remove arquivo do banco de dados

Adicionada variável:
- `UPLOADS_DIR`: Caminho para diretório de uploads (.data/uploads)

### 3. **app/api/documents/[documentId]/files/route.ts** (NOVO)
API para gerenciar uploads de arquivos:
- **GET**: Retorna lista de arquivos de um documento/subdocumento
- **POST**: Upload de novo arquivo (máx 10MB)
- **DELETE**: Remove arquivo (físico e metadados)

Query params:
- `subdocumentId` (opcional): ID do subdocumento

### 4. **app/api/documents/[documentId]/files/download/route.ts** (NOVO)
API para download de arquivos:
- **GET**: Download do arquivo com headers apropriados
- Query params:
  - `fileId`: ID do arquivo a descarregar
  - `subdocumentId` (opcional): ID do subdocumento

### 5. **components/FileManager.tsx** (NOVO)
Componente React para gerenciar arquivos:
- Upload de arquivos via input file
- Lista de arquivos com:
  - Nome original (clicável para download)
  - Tamanho formatado
  - Data/hora do upload
  - Botão de deleção
- Estados de carregamento e erro
- Formatação de datas em pt-BR
- Limite de 10MB por arquivo

### 6. **components/DocumentView.tsx** (MODIFICADO)
Integração da funcionalidade de arquivos:
- Novo estado `showFiles` para controlar visibilidade do painel
- Novo botão "Arquivos" no header (ao lado de "Subdocs")
- Novo painel lateral para FileManager
- Painel exibe arquivos do documento/subdocumento atual
- Compartilha backdrop com painel de subdocs

## Estrutura de Diretórios
```
.data/
├── documents.json (metadados dos documentos)
└── uploads/
    └── [documentId]/
        ├── [subdocumentId]/
        │   └── [fileId].[ext]
        └── [fileId].[ext]
```

## Limite de Uploads
- Máximo de 10MB por arquivo
- Sem limite total de arquivos por documento

## Fluxo de Funcionamento

### Upload:
1. Usuário clica em "Arquivos" no header
2. Painel lateral abre mostrando FileManager
3. Usuário seleciona arquivo
4. FileManager:
   - Valida tamanho
   - Envia para API `/files` (POST)
   - API salva arquivo em disco
   - API adiciona metadados ao banco
   - FileManager atualiza lista local

### Download:
1. Usuário clica no nome do arquivo na lista
2. Navegador baixa de `/files/download?fileId=...`
3. API retorna arquivo com headers apropriados

### Deleção:
1. Usuário clica no ícone 🗑️
2. Confirmação de deleção
3. API DELETE remove arquivo e metadados
4. Lista atualizada localmente

## Pontos Técnicos
- Arquivos salvos com UUID como nome (preserva original em metadados)
- Suporte a qualquer tipo de arquivo (validação apenas de tamanho)
- Separação de arquivos por documento e subdocumento
- Metadados persistidos em JSON (documents.json)
- Integração com sistema de subdocumentos existente
