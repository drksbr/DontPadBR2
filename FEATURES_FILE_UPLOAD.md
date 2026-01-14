# 📎 Funcionalidade de Upload de Arquivos - DontPadBR2

## ✨ O que foi implementado

### 1. **Sistema de Upload de Arquivos**

- ✅ Upload de arquivos (até 10MB por arquivo)
- ✅ Armazenamento isolado por documento/subdocumento
- ✅ Metadados persistidos em banco de dados

### 2. **API REST**

- ✅ `GET /api/documents/[documentId]/files` - Listar arquivos
- ✅ `POST /api/documents/[documentId]/files` - Upload de arquivo
- ✅ `DELETE /api/documents/[documentId]/files` - Deletar arquivo
- ✅ `GET /api/documents/[documentId]/files/download` - Download de arquivo

### 3. **Interface de Usuário**

- ✅ Novo botão "Arquivos" no header
- ✅ Painel lateral com gerenciador de arquivos
- ✅ Lista de arquivos com tamanho e data
- ✅ Download com um clique
- ✅ Deleção com confirmação

### 4. **Componentes React**

- ✅ `FileManager.tsx` - Componente de gerenciamento de arquivos
- ✅ Integração no `DocumentView.tsx`
- ✅ Suporte a documentos e subdocumentos

## 🗂️ Estrutura de Arquivos

```bash
.data/uploads/
├── documento1/
│   ├── subdoc-id/
│   │   ├── uuid.pdf
│   │   └── uuid.docx
│   └── uuid.jpg
├── documento2/
│   └── uuid.mp3
```

## 🎯 Como Usar

### Upload

1. Clique no botão "Arquivos" no topo da página
2. Clique em "+ Adicionar Arquivo"
3. Selecione um arquivo (máx 10MB)
4. O arquivo aparecerá na lista

### Download

1. Clique no nome do arquivo na lista

### Deletar

1. Clique no ícone 🗑️
2. Confirme a deleção

## 🔧 Detalhes Técnicos

### Tipos (lib/types.ts)

```typescript
interface DocumentFile {
  id: string;
  name: string; // UUID + extensão
  originalName: string; // Nome original
  mimeType: string;
  size: number;
  uploadedAt: number;
}
```

### Funções de Banco de Dados (lib/db.ts)

- `getDocumentUploadsDir(documentId, subdocumentId?)` - Retorna caminho do diretório
- `addFileToDocument(documentId, file, subdocumentId?)` - Salva metadados
- `getDocumentFiles(documentId, subdocumentId?)` - Lista arquivos
- `deleteDocumentFile(documentId, fileId, subdocumentId?)` - Remove arquivo

## 📝 Notas

- Cada documento/subdocumento tem seus próprios arquivos isolados
- Arquivos são salvos no disco com UUID como nome
- Nomes originais são preservados em metadados
- Limite de 10MB por arquivo (configurável em `MAX_FILE_SIZE`)
- Suporta qualquer tipo de arquivo
- Interface adaptável a mobile e desktop

## 🚀 Próximas Melhorias Possíveis

1. Adicionar drag-and-drop para upload
2. Preview de imagens na lista
3. Barra de progresso para uploads grandes
4. Compressão de imagens
5. Quotas de espaço por documento
6. Histórico de versões de arquivos
