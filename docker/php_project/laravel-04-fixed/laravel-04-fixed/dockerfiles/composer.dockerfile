# Usa a imagem oficial mais recente do Composer (gerenciador de dependências PHP)
FROM composer:latest

# Cria um grupo e um usuário chamado "laravel" com ID 1000
RUN addgroup -g 1000 laravel && adduser -G laravel -g laravel -s /bin/sh -D laravel

# Define que o usuário "laravel" será usado para executar comandos a partir daqui
USER laravel

# Define o diretório de trabalho onde os comandos composer serão executados
WORKDIR /var/www/html

# Define o comando padrão a ser executado ao rodar esse container
# O argumento "--ignore-platform-reqs" ignora verificações de versão do PHP/extensões ao instalar dependências
ENTRYPOINT [ "composer", "--ignore-platform-reqs" ]
