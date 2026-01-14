#!/bin/bash

# =============================================================================
# Script de Setup para VPS Ubuntu (sem Docker)
# =============================================================================
# Este script instala e configura:
# - Bun (runtime)
# - Y-Sweet (servidor de colaboração)
# - PM2 (gerenciador de processos)
# - Nginx (reverse proxy)
# =============================================================================

set -e  # Para execução em caso de erro

echo "========================================="
echo "  DontPad VPS Setup - Instalação"
echo "========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório da aplicação
APP_DIR="/var/www/dontpad"
DATA_DIR="/var/lib/dontpad"

# -----------------------------------------------
# 1. Atualizar sistema
# -----------------------------------------------
echo -e "${GREEN}[1/7] Atualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# -----------------------------------------------
# 2. Instalar dependências básicas
# -----------------------------------------------
echo -e "${GREEN}[2/7] Instalando dependências...${NC}"
sudo apt install -y curl unzip build-essential nginx certbot python3-certbot-nginx

# -----------------------------------------------
# 3. Instalar Bun
# -----------------------------------------------
echo -e "${GREEN}[3/7] Instalando Bun...${NC}"
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Adicionar ao bashrc/zshrc
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
    
    source ~/.bashrc
else
    echo "Bun já instalado"
fi

# -----------------------------------------------
# 4. Instalar Rust e Y-Sweet
# -----------------------------------------------
echo -e "${GREEN}[4/7] Instalando Rust e Y-Sweet...${NC}"
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    
    # Adicionar ao bashrc
    echo 'source "$HOME/.cargo/env"' >> ~/.bashrc
else
    echo "Rust já instalado"
fi

# Instalar Y-Sweet
if ! command -v y-sweet &> /dev/null; then
    cargo install y-sweet
else
    echo "Y-Sweet já instalado"
fi

# -----------------------------------------------
# 5. Instalar PM2 (gerenciador de processos)
# -----------------------------------------------
echo -e "${GREEN}[5/7] Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    bun add -g pm2
else
    echo "PM2 já instalado"
fi

# -----------------------------------------------
# 6. Criar diretórios
# -----------------------------------------------
echo -e "${GREEN}[6/7] Criando diretórios...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $DATA_DIR/ysweet
sudo mkdir -p $DATA_DIR/app-data
sudo chown -R $USER:$USER $APP_DIR
sudo chown -R $USER:$USER $DATA_DIR

# -----------------------------------------------
# 7. Configurar Firewall
# -----------------------------------------------
echo -e "${GREEN}[7/7] Configurando firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Setup concluído com sucesso!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Fazer upload do código para $APP_DIR"
echo "2. Executar ./vps-start.sh para iniciar os serviços"
echo "3. Configurar Nginx (usar deploy/nginx.conf)"
echo "4. Configurar SSL com: sudo certbot --nginx -d seu-dominio.com.br"
echo ""
