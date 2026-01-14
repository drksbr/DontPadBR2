#!/bin/bash

# =============================================================================
# Script de Deploy para VPS
# =============================================================================
# Este script faz upload do código para a VPS e reinicia os serviços
# Uso: ./vps-deploy.sh usuario@ip-da-vps
# =============================================================================

set -e

# Verificar se foi passado o servidor
if [ -z "$1" ]; then
    echo "Uso: $0 usuario@ip-da-vps"
    echo "Exemplo: $0 root@45.162.145.14"
    exit 1
fi

SERVER=$1
APP_DIR="/var/www/dontpad"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "  DontPad - Deploy para VPS"
echo "========================================="

# -----------------------------------------------
# 1. Build local
# -----------------------------------------------
echo -e "${GREEN}[1/4] Fazendo build local...${NC}"
bun install --frozen-lockfile
bun run build

# -----------------------------------------------
# 2. Criar arquivo tar
# -----------------------------------------------
echo -e "${GREEN}[2/4] Empacotando aplicação...${NC}"

# Criar diretório temporário
mkdir -p /tmp/dontpad-deploy

# Copiar apenas arquivos necessários
rsync -av \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'data' \
    --exclude '.env.local' \
    . /tmp/dontpad-deploy/

# Copiar build
cp -r .next /tmp/dontpad-deploy/
cp -r node_modules /tmp/dontpad-deploy/

# Criar tar
cd /tmp
tar -czf dontpad-deploy.tar.gz dontpad-deploy/

# -----------------------------------------------
# 3. Upload para VPS
# -----------------------------------------------
echo -e "${GREEN}[3/4] Fazendo upload para $SERVER...${NC}"

# Upload do tar
scp /tmp/dontpad-deploy.tar.gz $SERVER:/tmp/

# Extrair e mover na VPS
ssh $SERVER << 'ENDSSH'
    cd /tmp
    tar -xzf dontpad-deploy.tar.gz
    
    # Backup anterior (se existir)
    if [ -d "/var/www/dontpad" ]; then
        sudo mv /var/www/dontpad /var/www/dontpad.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Mover nova versão
    sudo mv dontpad-deploy /var/www/dontpad
    sudo chown -R $USER:$USER /var/www/dontpad
    
    # Limpar
    rm dontpad-deploy.tar.gz
ENDSSH

# -----------------------------------------------
# 4. Reiniciar serviços
# -----------------------------------------------
echo -e "${GREEN}[4/4] Reiniciando serviços...${NC}"

ssh $SERVER << 'ENDSSH'
    cd /var/www/dontpad/deploy
    bash vps-start.sh
ENDSSH

# Limpar local
rm -rf /tmp/dontpad-deploy
rm /tmp/dontpad-deploy.tar.gz

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Verificar logs:${NC}"
echo "ssh $SERVER 'pm2 logs'"
echo ""
