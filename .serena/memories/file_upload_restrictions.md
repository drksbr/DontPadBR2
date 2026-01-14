# Restrições de Upload de Arquivos

## Implementado em: 14 de janeiro de 2026

### Limite de Tamanho
- **Máximo**: 50MB (aumentado de 10MB)
- Validação ocorre no servidor antes de salvar no disco

### Tipos de Arquivo Permitidos

#### 📄 Microsoft Office
- .doc, .docx (Word)
- .xls, .xlsx (Excel)
- .ppt, .pptx (PowerPoint)

#### 📊 LibreOffice / OpenDocument
- .odt (Texto)
- .ods (Planilha)
- .odp (Apresentação)

#### 📑 PDF
- .pdf

#### 📝 Arquivos de Texto
- .txt (Texto simples)
- .csv (Valores separados por vírgula)
- .md (Markdown)

#### 🖼️ Imagens (todos os tipos)
- .jpg, .jpeg
- .png
- .gif
- .webp
- .svg
- .bmp
- .tiff, .tif
- .ico

### Validação Implementada

#### Server-side (app/api/documents/[documentId]/files/route.ts)
1. Verifica MIME type contra whitelist
2. Verifica extensão do arquivo contra whitelist
3. Ambas as validações devem passar
4. Retorna erro descritivo se arquivo não é permitido

#### Client-side (components/FileManager.tsx)
- Mostra lista de formatos aceitos
- Mostra limite de tamanho (50MB)
- Exibe mensagem amigável em português

### MIME Types Permitidos

```
Microsoft Office:
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- application/vnd.ms-powerpoint
- application/vnd.openxmlformats-officedocument.presentationml.presentation

LibreOffice:
- application/vnd.oasis.opendocument.text
- application/vnd.oasis.opendocument.spreadsheet
- application/vnd.oasis.opendocument.presentation

PDF:
- application/pdf

Texto:
- text/plain
- text/csv
- text/markdown

Imagens:
- image/* (todos os tipos)
```

### Fluxo de Validação

1. **Cliente** seleciona arquivo via FileManager
2. **Upload POST** envia arquivo para servidor
3. **Servidor valida**:
   - Tamanho do arquivo
   - MIME type
   - Extensão do arquivo
4. **Se válido**: Salva no disco e retorna metadata
5. **Se inválido**: Retorna erro com descrição de tipos aceitos
6. **Cliente** exibe erro ou adiciona arquivo ao Y-Sweet

### Mensagens de Erro

- "File size exceeds maximum limit of 50MB"
- "File type not allowed. Accepted formats: [lista de extensões]"

### Segurança

- Whitelist dupla (MIME type + extensão)
- Validação no servidor (não confia apenas no cliente)
- Nomes de arquivo são sanitizados (UUID + extensão original)
- Limite de tamanho evita DoS

### Possíveis Melhorias Futuras

1. Magic number validation (verificar bytes iniciais do arquivo)
2. Antivírus scanning para uploads
3. Quotas por usuário/documento
4. Compressão automática de imagens
5. Conversão de formatos (ex: DOCX -> PDF)
