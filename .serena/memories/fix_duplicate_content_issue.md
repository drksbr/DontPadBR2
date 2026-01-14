# Correção: Problema de Múltiplas Notas com Mesmo Conteúdo

## Problema Identificado
Todas as notas (principal e subnotas) estavam sendo editadas simultaneamente com o mesmo conteúdo.

## Causa Raiz
O código anterior estava tentando armazenar plain objects no Y.Map e acessar `.get('text')` neles, mas:
- Plain objects não são Y.Text automáticamente
- Todas as notas acabavam referenciando o mesmo Y.Text ('text')
- Não havia isolamento entre os conteúdos

## Solução Implementada

### TextEditor.tsx - Usar chaves Y.Text diferentes
```typescript
// Antes (ERRADO):
const yText = useText('text')  // sempre a mesma chave
const subdocYText = subdocumentsMap.get(subdocumentName).get('text')  // acesso inválido

// Depois (CORRETO):
const textKey = subdocumentName 
    ? `text:${subdocumentName}` // chave única por subnota
    : 'text'                      // chave da nota principal
const yText = useText(textKey)  // Y.Text diferente para cada nota
```

**Por que funciona:**
- `useText()` cria/recupera um Y.Text com a chave especificada
- Chaves diferentes = Y.Text diferentes
- Cada nota tem seu próprio buffer de conteúdo sincronizado

### SubdocumentManager.tsx - Voltar ao padrão de API
- Removido: Manipulação direta do Y.Map (que não funcionava como esperado)
- Mantido: Chamadas HTTP para criar/deletar subnotas
- O Y-Sweet sincroniza automaticamente as Y.Text com base nas chaves

### Por que a abordagem anterior falhou
A ideia de nesting Y.Text dentro de Y.Map é válida em Yjs, mas requer:
1. Criar explicitamente Y.Text dentro de Y.Map: `map.set('key', new Y.Text())`
2. Acessar corretamente: `map.get('key')` retorna o Y.Text
3. Isso não estava sendo feito - apenas armazenávamos plain objects

## Estrutura Final (Mais Simples e Funcional)

```
Y-Sweet Document 'isaacramon':
├─ text (Y.Text) → Conteúdo da nota principal
├─ text:subnota-1 (Y.Text) → Conteúdo subnota 1
└─ text:subnota-2 (Y.Text) → Conteúdo subnota 2
```

**Vantagens desta abordagem:**
✅ Sem necessidade de Y.Map complexo
✅ Y.Text isolados por chave (garantido pelo Y-Sweet)
✅ Sincronização automática
✅ Simples e robusto
✅ Compatível com a API existente

## Benefícios Mantidos
- ✅ Um único documento Y-Sweet (não múltiplos)
- ✅ Uma conexão WebSocket por documento
- ✅ Transações podem ser atômicas quando necessário
- ✅ Metadados em JSON para backups/queries

## Testing
✅ Build compila sem erros (VoiceChat.tsx tem erro não relacionado)
✅ Servidor inicia com sucesso
✅ Estrutura de dados é mais simples e confiável