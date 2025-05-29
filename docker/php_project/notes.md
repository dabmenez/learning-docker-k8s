
# 🐳 Dockerizando um Projeto Laravel + PHP

## 🎯 Objetivo do Setup

Queremos rodar uma aplicação Laravel de forma completamente isolada e reproduzível com Docker. O projeto terá múltiplos contêineres, cada um com uma responsabilidade clara:

- **Nginx** como servidor web
- **PHP-FPM** para processar requisições PHP
- **MySQL** como banco de dados
- **Composer** para gerenciamento de dependências
- **Artisan** e **npm** como utilitários extras

---

## 🧪 Criando os Serviços com Docker Compose

### 🔹 nginx (servidor web)
- Usa `nginx.dockerfile`
- Expõe porta `8000:80`
- Monta `src` como `/var/www/html`
- Monta `nginx.conf` como `default.conf`

### 🔹 php (interpretador)
- Usa `php.dockerfile`
- Instala `pdo_mysql` e roda como usuário `laravel`

### 🔹 mysql
- Usa imagem `mysql:5.7`
- Recebe envs via `mysql.env`

### 🔹 composer (utilitário)
- Usa `composer.dockerfile`
- Comando: `composer --ignore-platform-reqs`
- Permite instalar o Laravel direto no volume

### 🔹 artisan e npm (utilitários)
- `artisan`: roda comandos do Laravel
- `npm`: instala pacotes JS para o frontend

---

## ⚙️ docker-compose.yaml (Resumo)

```yaml
services:
  server: nginx
  php: php-fpm
  mysql: mysql
  composer: composer
  artisan: php artisan ...
  npm: npm install ...
```

---

## 📦 Dockerfiles

### `php.dockerfile`
- Usa imagem `php:8.0-fpm-alpine`
- Instala `pdo`, `pdo_mysql`
- Cria usuário `laravel`
- Copia `src` para `/var/www/html`

### `nginx.dockerfile`
- Usa imagem `nginx:stable-alpine`
- Copia `nginx.conf` como `default.conf`
- Copia `src` também para servir estáticos

### `composer.dockerfile`
- Usa `composer:latest`
- Apenas define `ENTRYPOINT` e monta `src`

---

## 🛠️ Comandos Úteis

```bash
# Criar projeto Laravel via composer
docker compose run --rm composer create-project laravel/laravel .

# Rodar o projeto
docker compose up

# Usar utilitários
docker compose run --rm artisan migrate
docker compose run --rm npm install
```

---

## 🔄 COPY vs Bind Mounts

| COPY                      | Bind Mount                        |
|--------------------------|-----------------------------------|
| Usa snapshot da build    | Acompanha mudanças em tempo real |
| Ideal p/ produção        | Ideal p/ desenvolvimento          |

---

## 📌 Dicas Finais

- Use volumes nomeados ou `bind mounts` com `:delegated` para performance no Mac/WSL2
- Prefira múltiplos serviços pequenos e reutilizáveis
- Dockerize também ferramentas de desenvolvimento (npm, artisan, etc.)

---

## 📎 Recursos

- `docker-compose.yaml`: organização limpa e extensível
- `.env`: variável de ambiente para o MySQL
- `nginx.conf`: configuração simples e clara para Laravel

---