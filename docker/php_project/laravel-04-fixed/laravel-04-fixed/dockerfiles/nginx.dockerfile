# Usa a imagem oficial e estável do Nginx baseada no Alpine
FROM nginx:stable-alpine

# Define o diretório onde ficam as configurações do Nginx
WORKDIR /etc/nginx/conf.d

# Copia o arquivo de configuração nginx.conf do host para dentro do container
COPY nginx/nginx.conf .

# Renomeia o nginx.conf para default.conf, que é o nome padrão esperado pelo Nginx
RUN mv nginx.conf default.conf

# Muda o diretório de trabalho para onde os arquivos da aplicação serão servidos
WORKDIR /var/www/html

# Copia os arquivos do projeto Laravel para o diretório público do Nginx
COPY src .
