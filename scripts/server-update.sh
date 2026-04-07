#!/bin/bash
#
# NextOlymp server update — Lightsail / Ubuntu
#
# Foydalanish:
#   cd /opt/nextolymp
#   ./scripts/server-update.sh
#
# Skript Docker Hub'dan eng yangi imagelarni pull qiladi va konteynerlarni
# qayta ishga tushiradi. Build qilish kerak emas — hammasi lokal kompyuterda
# (Windows) build qilingan va ghcr/docker hub'da tayyor.

set -e

PROJECT_DIR="/opt/nextolymp"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$PROJECT_DIR"

echo ""
echo "========================================="
echo " NextOlymp Server Update"
echo "========================================="
echo ""

# .env borligini tekshirish
if [ ! -f .env ]; then
    echo "[X] .env fayli topilmadi: $PROJECT_DIR/.env"
    echo "    Avval .env faylini yarating va DOCKER_USERNAME=aoolimov qatorini qo'shing."
    exit 1
fi

# DOCKER_USERNAME mavjudligini tekshirish
if ! grep -q "^DOCKER_USERNAME=" .env; then
    echo "[!] .env faylida DOCKER_USERNAME yo'q. Qo'shaman..."
    echo "" >> .env
    echo "# Docker Hub username (aoolimov tomonidan push qilingan imagelar)" >> .env
    echo "DOCKER_USERNAME=aoolimov" >> .env
    echo "[OK] DOCKER_USERNAME=aoolimov qo'shildi"
fi

echo "[1/5] Git pull (yangi konfiguratsiya bo'lsa)..."
git pull || echo "[!] Git pull bekor qilindi (xato emas)"
echo ""

echo "[2/5] Yangi imagelarni pull qilish Docker Hub'dan..."
docker compose -f "$COMPOSE_FILE" pull backend frontend
echo ""

echo "[3/5] Konteynerlarni qayta ishga tushirish..."
docker compose -f "$COMPOSE_FILE" up -d backend frontend nginx
echo ""

echo "[4/5] Eski imagelarni tozalash..."
docker image prune -f
echo ""

echo "[5/5] Holatni tekshirish (10 sekund kutamiz)..."
sleep 10
docker compose -f "$COMPOSE_FILE" ps
echo ""

# Health check
echo -n " Backend (nginx orqali): "
if curl -sf https://nextolymp.uz/api/v1/health > /dev/null 2>&1; then
    echo "OK ✓"
else
    echo "FAILED ✗"
    echo " Loglar:"
    docker compose -f "$COMPOSE_FILE" logs backend --tail 30
fi

echo -n " Frontend (nginx orqali): "
if curl -sf -o /dev/null -w "%{http_code}" https://nextolymp.uz | grep -qE "200|301|302"; then
    echo "OK ✓"
else
    echo "FAILED ✗"
    docker compose -f "$COMPOSE_FILE" logs frontend --tail 30
fi

echo ""
echo "========================================="
echo " Deploy tugadi!"
echo " Sayt: https://nextolymp.uz"
echo "========================================="
