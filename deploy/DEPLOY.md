# Deploy do DontPad na VPS

## Pré-requisitos

- Ubuntu Server 20.04+
- Docker e Docker Compose instalados
- Domínio apontando para o IP da VPS (opcional, mas recomendado para HTTPS)

## 1. Instalação do Docker (se ainda não tiver)

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Reiniciar sessão para aplicar permissões
exit
# Faça login novamente
```

## 2. Clone do Projeto

```bash
# Clone o repositório
git clone <seu-repositorio> dontpad
cd dontpad
```

## 3. Configuração de Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env
nano .env
```

### ⚠️ IMPORTANTE: Configurar URL do Y-Sweet para HTTPS

Se você está usando HTTPS (recomendado), você **DEVE** configurar a variável `YSWEET_URL_PREFIX` com a URL pública do seu domínio. Isso é necessário para que o WebSocket funcione corretamente via WSS (WebSocket Secure).

```bash
# Adicione esta linha ao seu .env
YSWEET_URL_PREFIX=wss://seu-dominio.com.br/y-sweet
```

**Por que isso é necessário?**

- Quando sua página é servida via HTTPS, o navegador bloqueia conexões WebSocket não seguras (ws://)
- O Y-Sweet precisa saber qual é a URL pública para retornar ao cliente
- Sem isso, você verá o erro: "Mixed Content: ... attempted to connect to the insecure WebSocket endpoint 'ws://...'"

## 4. Build e Deploy

```bash
# Build das imagens (primeira vez demora ~5-10 min)
docker compose build

# Iniciar os containers
docker compose up -d

# Verificar se está rodando
docker compose ps

# Ver logs
docker compose logs -f
```

## 5. Configurar Nginx como Reverse Proxy (Recomendado)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Copiar configuração
sudo cp deploy/nginx.conf /etc/nginx/sites-available/dontpad

# Editar o arquivo e alterar 'seu-dominio.com.br' para seu domínio real
sudo nano /etc/nginx/sites-available/dontpad

# Ativar o site
sudo ln -s /etc/nginx/sites-available/dontpad /etc/nginx/sites-enabled/

# Remover configuração default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 6. Configurar HTTPS com Certbot (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com.br

# O Certbot vai renovar automaticamente, mas você pode testar:
sudo certbot renew --dry-run
```

## 7. Comandos Úteis

```bash
# Parar aplicação
docker compose down

# Reiniciar aplicação
docker compose restart

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f app
docker compose logs -f ysweet

# Rebuild após alterações no código
docker compose build --no-cache
docker compose up -d

# Ver uso de recursos
docker stats
```

## 8. Backup dos Dados

Os dados são persistidos em volumes Docker:

```bash
# Listar volumes
docker volume ls

# Backup do volume ysweet-data
docker run --rm -v dontpad_ysweet-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/ysweet-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup do volume app-data (subdocumentos)
docker run --rm -v dontpad_app-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/app-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 9. Firewall (UFW)

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

## Troubleshooting

### A aplicação não inicia

```bash
# Verificar logs
docker compose logs app

# Verificar se o y-sweet está rodando
docker compose logs ysweet
```

### WebSocket não conecta

- **Erro "Mixed Content" ou conexão ws:// bloqueada:**

  - Verifique se `YSWEET_URL_PREFIX` está configurado no `.env`
  - Deve ser `wss://seu-dominio.com.br/y-sweet` (com wss://, não ws://)
  - Após alterar, reinicie os containers: `docker compose down && docker compose up -d`

- Verifique se o Nginx está configurado corretamente para WebSocket (location /y-sweet/)
- Verifique se a porta 8080 está exposta no docker-compose.yml
- Teste se o Y-Sweet está respondendo: `curl http://localhost:8080/check_store`

### Build do y-sweet demora muito

O build do y-sweet compila Rust, pode demorar 10-15 minutos na primeira vez. Seja paciente!

### Erro de permissão nos volumes

```bash
# Corrigir permissões
sudo chown -R 1001:1001 /var/lib/docker/volumes/dontpad_*
```
