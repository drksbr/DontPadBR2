#!/bin/bash

# =============================================================================
# Inicia Next.js (porta 4000) e Y-Sweet (porta 4001)
# =============================================================================

set -e

echo "Iniciando serviços..."

# Carregar .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parar processos antigos
pm2 delete all 2>/dev/null || true

# Criar diretório de dados
mkdir -p ./data

# Procurar pelo binário y-sweet-linux-x64
if [ -f "./y-sweet-linux-x64" ]; then
    chmod +x ./y-sweet-linux-x64
    echo "✓ Usando y-sweet-linux-x64 local"
    pm2 start ./y-sweet-linux-x64 --name "ysweet" -- serve ./data --host 0.0.0.0 --port 4001 --url-prefix "${YSWEET_URL_PREFIX}"
    echo "✓ Y-Sweet iniciado na porta 4001"
elif command -v y-sweet &> /dev/null; then
    echo "✓ Usando y-sweet do sistema"
    pm2 start "$(which y-sweet)" --name "ysweet" -- serve ./data --host 0.0.0.0 --port 4001 --url-prefix "${YSWEET_URL_PREFIX}"
    echo "✓ Y-Sweet iniciado na porta 4001"
else
    echo "⚠️  Y-Sweet não encontrado (nem ./y-sweet-linux-x64 nem no PATH)"
    echo "   Baixe de: https://github.com/drifting-in-space/y-sweet/releases"
    echo "   Continuando apenas com Next.js..."
fi

# Iniciar Next.js na porta 4000
echo "Iniciando Next.js..."
PORT=4000 pm2 start bun --name "nextjs" -- run start

# Salvar
pm2 save

echo ""
echo "✓ Serviços iniciados:"
echo "  - Next.js: http://localhost:4000"
echo "  - Y-Sweet: ws://localhost:4001"
echo ""
pm2 list
