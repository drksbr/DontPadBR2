#!/bin/bash

# Para tudo, limpa cache, reconstrói e reinicia

echo "⏸️  Parando serviços..."
pm2 delete all 2>/dev/null || true

echo "🧹 Limpando cache..."
rm -rf .next

echo "🔨 Reconstruindo aplicação..."
bun run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído! Iniciando serviços..."
    ./start.sh
else
    echo ""
    echo "❌ Build falhou!"
    exit 1
fi
