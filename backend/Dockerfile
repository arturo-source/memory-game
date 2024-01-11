FROM php:8.3-rc-alpine

WORKDIR /var/www/html
EXPOSE 80

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .

RUN composer install
RUN apk add --update npm
RUN npm install
RUN npm run build

CMD ["php","artisan","serve","--host=0.0.0.0", "--port=80"]
