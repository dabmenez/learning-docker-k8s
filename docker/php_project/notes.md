
# 🐳 Dockerizing a Laravel + PHP Project

---

## 🎯 Project Goal

The goal is to run a Laravel application in a fully containerized, reproducible environment using Docker. This project uses multiple containers, each with a clear responsibility:

- **Nginx** as the web server  
- **PHP-FPM** to process PHP requests  
- **MySQL** as the database  
- **Composer** to manage dependencies  
- **Artisan** and **npm** as utility services

---

## 🧱 Application Structure

```
LARAVEL-04-FIXED/
├── dockerfiles/
│   ├── composer.dockerfile
│   ├── nginx.dockerfile
│   └── php.dockerfile
├── env/
│   └── mysql.env
├── nginx/
│   └── nginx.conf
├── src/           # Laravel application source code
└── docker-compose.yaml
```

---

## 🧪 Docker Compose Services Breakdown

### 🔹 nginx (Web Server)
- Uses `nginx.dockerfile`
- Maps port `8000:80`
- Mounts `src` as `/var/www/html`
- Mounts custom `nginx.conf` as `default.conf`

### 🔹 php (PHP-FPM)
- Uses `php.dockerfile`
- Installs required extensions
- Runs as user `laravel`

### 🔹 mysql (Database)
- Uses official `mysql:5.7` image
- Loads credentials and configs from `mysql.env`

### 🔹 composer (Utility)
- Uses `composer.dockerfile`
- Used to install Laravel via:
  ```bash
  docker compose run --rm composer create-project laravel/laravel .
  ```

### 🔹 artisan and npm (Utilities)
- `artisan`: Laravel CLI commands (e.g. migrate, tinker)
- `npm`: Install and build frontend JS assets

---

## ⚙️ `docker-compose.yaml` Summary

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

## 📦 Dockerfile Descriptions

### `php.dockerfile`
- Based on `php:8.0-fpm-alpine`
- Installs PDO extensions
- Adds a non-root user `laravel`
- Copies Laravel source code

### `nginx.dockerfile`
- Based on `nginx:stable-alpine`
- Uses a custom `nginx.conf`
- Copies static files from `src`

### `composer.dockerfile`
- Based on `composer:latest`
- Adds user `laravel`
- Runs composer with `--ignore-platform-reqs`

---

## 🛠️ Common Commands

```bash
# Create a new Laravel project
docker compose run --rm composer create-project laravel/laravel .

# Start the environment
docker compose up

# Run Laravel commands
docker compose run --rm artisan migrate
docker compose run --rm npm install
```

---

## 🔄 COPY vs Bind Mounts

| COPY (in Dockerfile)        | Bind Mount (in docker-compose)         |
|----------------------------|----------------------------------------|
| Snapshot during image build| Syncs live changes from host           |
| Good for production        | Ideal for development                  |

---

## 📌 Final Tips

- Use `:delegated` flag on volumes for performance (macOS/WSL2)
- Split responsibilities into focused containers
- Dockerize CLI tools like `artisan` and `npm` for consistency

---

## 📎 Resources

- `docker-compose.yaml`: clean and modular setup
- `.env`: used for MySQL config
- `nginx.conf`: basic Laravel config
