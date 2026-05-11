FROM php:8.3-fpm-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    nodejs \
    npm \
    linux-headers

# Configure GD
RUN docker-php-ext-configure gd --with-freetype --with-jpeg

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    gd \
    mbstring \
    xml \
    pcntl \
    bcmath \
    exif

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install PCNTL for queue workers
RUN docker-php-ext-enable pcntl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create application user
RUN addgroup -g 1000 -S www-data && \
    adduser -u 1000 -S www-data -G www-data

WORKDIR /var/www/html

# Copy application files
COPY --chown=www-data:www-data ../../src /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Build frontend assets
RUN npm ci && npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Create health check script
RUN echo '#!/bin/sh\n\
php artisan health:check\n\
exit $?' > /usr/local/bin/health-check && \
    chmod +x /usr/local/bin/health-check

# Create entrypoint script
RUN echo '#!/bin/sh\n\
php artisan migrate --force\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
php artisan event:cache\n\
php-fpm\n\
' > /usr/local/bin/docker-entrypoint && \
    chmod +x /usr/local/bin/docker-entrypoint

USER www-data

EXPOSE 9000

ENTRYPOINT ["docker-entrypoint"]
CMD ["php-fpm"]
