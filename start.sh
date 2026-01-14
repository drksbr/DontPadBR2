#!/bin/bash

# Inicia Next.js (porta 4000) e Y-Sweet (porta 4001) com PM2

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
    YSWEET_PATH=$(which y-sweet)
    echo "✓ Usando y-sweet do sistema: $YSWEET_PATH"
    pm2 start "$YSWEET_PATH" --name "ysweet" -- serve ./data --host 0.0.0.0 --port 4001 --url-prefix "${YSWEET_URL_PREFIX}"
    echo "✓ Y-Sweet iniciado na porta 4001"
else
    echo "⚠️  Y-Sweet não encontrado (nem ./y-sweet-linux-x64 nem no PATH)"
    echo "   Baixe de: https://github.com/drifting-in-space/y-sweet/releases"
    echo "   Continuando apenas com Next.js..."
fi

# Iniciar Next.js na porta 4000
echo "Iniciando Next.js..."
if [ -f ".next/standalone/server.js" ]; then
    # Usar standalone se já foi feito build
    PORT=4000 pm2 start bun --name "nextjs" -- .next/standalone/server.js
else
    # Fazer build primeiro
    echo "Build não encontrado. Fazendo build..."
    bun run build
    PORT=4000 pm2 start bun --name "nextjs" -- .next/standalone/server.js
fi

# Salvar
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URLs:"
echo "  • Next.js: http://localhost:4000"
if [ -f "./y-sweet-linux-x64" ] || command -v y-sweet &> /dev/null; then
    echo "  • Y-Sweet: ws://localhost:4001"
fi
echo ""
echo "Comandos:"
echo "  pm2 logs         # Ver logs"
echo "  pm2 restart all  # Reiniciar"
echo "  pm2 stop all     # Parar"
echo ""
