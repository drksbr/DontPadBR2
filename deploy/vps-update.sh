#!/bin/bash

# Script para atualizar código na VPS com as correções de porta

echo "Atualizando código na VPS..."

# 1. Parar serviços
pm2 delete all 2>/dev/null || true

# 2. Fazer backup do .env
cp .env .env.backup

# 3. Atualizar código (git pull ou copiar arquivos)
# Se estiver usando git:
# git pull

# 4. Reinstalar dependências
bun install

# 5. Limpar build antigo
rm -rf .next

# 6. Build
bun run build

# 7. Restaurar .env
mv .env.backup .env

# 8. Iniciar
./start.sh

echo ""
echo "✅ Atualização completa!"
