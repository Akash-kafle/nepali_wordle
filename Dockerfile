FROM nginx:1.27-alpine

# Copy static files
COPY . /usr/share/nginx/html

# Copy dynamic configuration injection entrypoint script
COPY inject-config.sh /docker-entrypoint.d/40-inject-config.sh
RUN chmod +x /docker-entrypoint.d/40-inject-config.sh

# Expose port 80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/ || exit 1
