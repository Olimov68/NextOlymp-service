FROM nginx:1.25-alpine

# Custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# SSL certificates papkasi (production uchun mount qilinadi)
RUN mkdir -p /etc/nginx/ssl

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost/health || exit 1

EXPOSE 80 443
