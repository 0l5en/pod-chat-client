FROM nginx:1.23-alpine
EXPOSE 80
COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/mime.types /etc/nginx/mime.types
COPY build/ /var/www/