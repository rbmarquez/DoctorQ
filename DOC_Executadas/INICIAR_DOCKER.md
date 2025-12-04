# 🐳 Como Iniciar o Docker

## Verificar se Docker está instalado

```bash
docker --version
docker-compose --version
```

Se não estiver instalado, veja: https://docs.docker.com/engine/install/

---

## Iniciar Docker (Linux)

### Opção 1: Systemd (Ubuntu/Debian)

```bash
# Verificar status
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker

# Habilitar para iniciar automaticamente
sudo systemctl enable docker

# Verificar se iniciou
docker info
```

### Opção 2: Docker Desktop (se instalado)

```bash
# Abrir Docker Desktop
systemctl --user start docker-desktop

# Ou procure "Docker Desktop" no menu de aplicações e inicie
```

### Opção 3: Adicionar seu usuário ao grupo docker (sem sudo)

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente, ou:
newgrp docker

# Testar
docker ps
```

---

## Verificar se Docker está funcionando

```bash
# Deve retornar informações do Docker
docker info

# Listar containers rodando
docker ps

# Testar com container hello-world
docker run hello-world
```

---

## Após Docker iniciar

Execute o script de inicialização:

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-video-service
./START.sh
```

Ou manualmente:

```bash
docker-compose up -d
```

---

## Troubleshooting

### Erro: "permission denied"

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Logout e login novamente
```

### Erro: "Cannot connect to Docker daemon"

```bash
# Iniciar serviço
sudo systemctl start docker

# Se usar Docker Desktop
systemctl --user start docker-desktop
```

### Erro: "docker-compose: command not found"

```bash
# Instalar docker-compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Ou usar docker compose (v2)
docker compose version
```

---

## Links Úteis

- [Instalar Docker (Linux)](https://docs.docker.com/engine/install/)
- [Instalar Docker Desktop](https://docs.docker.com/desktop/install/linux-install/)
- [Post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)
