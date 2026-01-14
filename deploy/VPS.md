# Deploy VPS (sem Docker)

Scripts para deploy em VPS dedicada usando Bun, Y-Sweet e PM2.

## 📋 Pré-requisitos

- Ubuntu Server 20.04+
- Acesso SSH root ou sudo
- Domínio apontando para o IP da VPS

## 🚀 Deploy Inicial

### 1. Na VPS (primeira vez)

```bash
# Fazer upload do script de setup
scp deploy/vps-setup.sh usuario@seu-ip:/tmp/

# Conectar na VPS
ssh usuario@seu-ip

# Executar setup
cd /tmp
chmod +x vps-setup.sh
./vps-setup.sh
```

Isso irá instalar:

- ✅ Bun (runtime JavaScript)
- ✅ Rust + Y-Sweet (colaboração)
- ✅ PM2 (gerenciador de processos)
- ✅ Nginx (reverse proxy)

### 2. Upload do código

**Opção A: Git Clone**

```bash
ssh usuario@seu-ip
cd /var/www
git clone seu-repositorio dontpad
cd dontpad
```

**Opção B: Deploy Script (do seu computador)**

```bash
# Do diretório do projeto
./deploy/vps-deploy.sh usuario@seu-ip
```

### 3. Configurar .env na VPS

```bash
ssh usuario@seu-ip
cd /var/www/dontpad
nano .env
```

Ajustar:

```bash
CONNECTION_STRING=ys://127.0.0.1:8080
YSWEET_URL_PREFIX=wss://api.seu-dominio.com.br
NODE_ENV=production
```

### 4. Iniciar serviços

```bash
cd /var/www/dontpad/deploy
./vps-start.sh
```

### 5. Configurar Nginx

```bash
# Copiar configuração
sudo cp /var/www/dontpad/deploy/nginx.conf /etc/nginx/sites-available/dontpad

# Editar domínio
sudo nano /etc/nginx/sites-available/dontpad
# Alterar 'seu-dominio.com.br' para seu domínio real

# Ativar site
sudo ln -s /etc/nginx/sites-available/dontpad /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL (HTTPS)

```bash
sudo certbot --nginx -d seu-dominio.com.br
```

## 📦 Estrutura na VPS

```
/var/www/dontpad/          # Código da aplicação
/var/lib/dontpad/          # Dados persistentes
  ├── ysweet/              # Documentos Y-Sweet
  └── app-data/            # Arquivos/versões
```

## 🔧 Comandos Úteis

### Ver status dos serviços

```bash
pm2 status
```

### Ver logs em tempo real

```bash
pm2 logs

# Ou específico
pm2 logs ysweet
pm2 logs dontpad-app
```

### Reiniciar serviços

```bash
pm2 restart all

# Ou específico
pm2 restart ysweet
pm2 restart dontpad-app
```

### Parar serviços

```bash
pm2 stop all
```

### Atualizar código (após git pull)

```bash
cd /var/www/dontpad
git pull
bun install
bun run build
pm2 restart all
```

### Monitorar recursos

```bash
pm2 monit
```

## 🔄 Deploy Automático

Do seu computador local:

```bash
./deploy/vps-deploy.sh usuario@seu-ip
```

Este script:

1. ✅ Faz build local
2. ✅ Empacota arquivos
3. ✅ Upload via SSH
4. ✅ Reinicia serviços

## 🐛 Troubleshooting

### Y-Sweet não inicia

```bash
# Verificar se está instalado
y-sweet --version

# Se não, instalar
cargo install y-sweet
```

### Erro de permissão

```bash
sudo chown -R $USER:$USER /var/www/dontpad
sudo chown -R $USER:$USER /var/lib/dontpad
```

### Porta já em uso

```bash
# Ver quem está usando
sudo lsof -i :3000
sudo lsof -i :8080

# Matar processo
pm2 delete all
```

### Next.js não compila

```bash
cd /var/www/dontpad
rm -rf .next node_modules
bun install
bun run build
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
htop
pm2 monit
```

### Logs do sistema

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PM2
pm2 logs --lines 100
```

## 🔐 Segurança

### Firewall

```bash
sudo ufw status
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Atualizar sistema

```bash
sudo apt update && sudo apt upgrade -y
```

## 🔄 Backup

```bash
# Backup manual
cd /var/lib/dontpad
tar -czf backup-$(date +%Y%m%d).tar.gz ysweet/ app-data/

# Restaurar
tar -xzf backup-YYYYMMDD.tar.gz
```

## 📞 Suporte

Para problemas específicos, verificar:

- Logs do PM2: `pm2 logs`
- Logs do Nginx: `/var/log/nginx/`
- Status dos processos: `pm2 status`
