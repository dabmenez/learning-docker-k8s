# Usa a imagem oficial do PHP com FPM (FastCGI Process Manager), baseada no Alpine (leve e rápida)
FROM php:8.0-fpm-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /var/www/html

# Copia os arquivos da pasta src/ do host para dentro do container
COPY src .

# Instala as extensões PDO e PDO_MYSQL necessárias para o Laravel se conectar ao banco de dados MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Cria um grupo e um usuário chamado "laravel" com ID 1000 (compatível com o host)
RUN addgroup -g 1000 laravel && adduser -G laravel -g laravel -s /bin/sh -D laravel

# Define que a partir daqui o container executará comandos como o usuário "laravel"
USER laravel

# (Comentado) Poderia ser usado para garantir que todos os arquivos tenham o dono certo
# RUN chown -R laravel:laravel .
