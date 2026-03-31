#!/bin/bash
# ============================================
# NextOlymp Production Deployment Script
# ============================================
# Ishlatish:
#   1. Serverga SSH orqali ulaning
#   2. Repo'ni clone qiling yoki pull qiling
#   3. .env faylini yarating: cp .env.production.example .env
#   4. .env ni to'ldiring
#   5. Bu skriptni ishga tushiring: bash deploy.sh
# ============================================

set -e

echo "=========================================="
echo "  NextOlymp Production Deploy"
echo "=========================================="

# .env tekshirish
if [ ! -f .env ]; then
    echo "ERROR: .env fayli topilmadi!"
    echo "Avval yarating: cp .env.production.example .env"
    echo "Keyin barcha qiymatlarni to'ldiring."
    exit 1
fi

# SSL sertifikat tekshirish
SSL_DIR=$(grep SSL_CERT_DIR .env | cut -d'=' -f2 | tr -d ' ')
if [ -z "$SSL_DIR" ] || [ ! -d "$SSL_DIR" ]; then
    echo "WARNING: SSL sertifikatlar papkasi topilmadi: $SSL_DIR"
    echo "Let's Encrypt o'rnatish uchun:"
    echo "  sudo apt install certbot"
    echo "  sudo certbot certonly --standalone -d nextolymp.uz"
    echo ""
    echo "Yoki ssl/ papkasini yarating va fullchain.pem + privkey.pem fayllarni qo'ying."

    # Self-signed sertifikat yaratish (test uchun)
    if [ ! -d "./ssl" ]; then
        echo "Self-signed sertifikat yaratilyapti (faqat test uchun)..."
        mkdir -p ./ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./ssl/privkey.pem \
            -out ./ssl/fullchain.pem \
            -subj "/CN=nextolymp.uz"
        echo "Self-signed SSL yaratildi."
    fi
fi

# Docker va Docker Compose tekshirish
if ! command -v docker &> /dev/null; then
    echo "Docker o'rnatilmagan. O'rnatish:"
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose o'rnatilmagan."
    exit 1
fi

echo ""
echo "1/4 - Docker imagelarni build qilish..."
docker compose -f docker-compose.prod.yml build

echo ""
echo "2/4 - Eski konteynerlarni to'xtatish..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "3/4 - Yangi konteynerlarni ishga tushirish..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "4/4 - Health check..."
sleep 15

# Health checks
echo -n "  Backend: "
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "OK ✓"
else
    echo "FAILED ✗"
    echo "  Loglar:"
    docker compose -f docker-compose.prod.yml logs backend --tail 20
fi

echo -n "  Frontend: "
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "OK ✓"
else
    echo "FAILED ✗"
    echo "  Loglar:"
    docker compose -f docker-compose.prod.yml logs frontend --tail 20
fi

echo -n "  Nginx: "
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "OK ✓"
else
    echo "FAILED ✗"
    echo "  Loglar:"
    docker compose -f docker-compose.prod.yml logs nginx --tail 20
fi

echo ""
echo "=========================================="
echo "  Deploy tugadi!"
echo "  Sayt: https://nextolymp.uz"
echo "  Admin: https://nextolymp.uz/admin"
echo "  API: https://nextolymp.uz/api/v1/health"
echo "=========================================="

# Eski imagelarni tozalash
docker image prune -f 2>/dev/null || true
