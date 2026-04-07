# Deploy Skriptlari

Saytni yangilash uchun ikki qadamli jarayon:

1. **Lokal kompyuter** (Windows): Docker imagelarni build + push qilish
2. **Server** (Lightsail): Yangi imagelarni pull + restart qilish

Bu sxemada **server build qilmaydi** — faqat tayyor imagelarni Docker Hub'dan tortib oladi. Bu Lightsail'ning kichik resursini tejaydi va deploy 30 sekundda tugaydi.

## Bir martalik sozlash

### 1. Lokal kompyuterda (Windows)

**Docker Desktop'ni yoqing** va Docker Hub'ga login bo'ling:

```powershell
docker login
```

Username (`aoolimov`) va parolingizni kiriting.

### 2. Serverda (Lightsail)

`/opt/nextolymp/.env` fayliga quyidagi qatorni qo'shing:

```bash
echo "DOCKER_USERNAME=aoolimov" >> /opt/nextolymp/.env
```

Skriptga execute permission bering:

```bash
chmod +x /opt/nextolymp/scripts/server-update.sh
```

## Har deploy

### 1. Lokal kompyuterda

PowerShell'da loyiha papkasiga kiring va skriptni ishga tushiring:

```powershell
cd C:\Users\user\Desktop\NextOlymp-service
.\scripts\deploy.ps1
```

Skript:
- Backend va Frontend Docker imagelarini build qiladi (2-5 daqiqa)
- Docker Hub'ga push qiladi (1-2 daqiqa)

Faqat backend yoki faqat frontend uchun:

```powershell
.\scripts\deploy.ps1 -BackendOnly
.\scripts\deploy.ps1 -FrontendOnly
```

Cache'ni bekor qilib qaytadan build qilish:

```powershell
.\scripts\deploy.ps1 -NoCache
```

### 2. Serverda

Lightsail terminal'da:

```bash
cd /opt/nextolymp
./scripts/server-update.sh
```

Yoki qo'lda:

```bash
cd /opt/nextolymp
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Tugadi! Sayt 30 sekundda yangilanadi.

## Imagelar

- `aoolimov/nextolymp-backend:latest`
- `aoolimov/nextolymp-frontend:latest`

Docker Hub'da: https://hub.docker.com/u/aoolimov

## Muammolar

### "denied: requested access to the resource is denied"

Docker Hub'ga login bo'lmagansiz. `docker login` qiling.

### "image not found" serverda

Imageni hali push qilmagansiz. Avval lokal kompyuterda `.\scripts\deploy.ps1` ishga tushiring.

### Eski versiya ko'rsatib turibdi

Brauzer cache. Ctrl+Shift+R bilan yangilang. Yoki `pull_policy: always` ishlab turibdimi tekshiring.
