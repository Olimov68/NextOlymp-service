# NextOlymp deploy skripti — Windows PowerShell
#
# Foydalanish:
#   1) Bir martalik: docker login
#   2) Har deploy: ./scripts/deploy.ps1
#
# Skript Backend va Frontend Docker imagelarini lokal kompyuterda build qiladi,
# Docker Hub'ga push qiladi. Keyin serverda `update.sh` orqali pull qilinadi.

param(
    [string]$Username = "aoolimov",
    [string]$Tag = "latest",
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

# Loyiha katalogi (skript joylashgan papkadan bir pog'ona yuqori)
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " NextOlymp Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Username: $Username" -ForegroundColor Yellow
Write-Host " Tag:      $Tag" -ForegroundColor Yellow
Write-Host " Project:  $ProjectDir" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Docker ishlayotganini tekshirish
try {
    docker info | Out-Null
} catch {
    Write-Host "[X] Docker Desktop ishlamayapti. Avval Docker Desktop'ni oching." -ForegroundColor Red
    exit 1
}

# Login holatini tekshirish
$loginCheck = docker info 2>&1 | Select-String "Username:"
if (-not $loginCheck) {
    Write-Host "[!] Docker Hub'ga kirilmagan. 'docker login' qiling." -ForegroundColor Yellow
    docker login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] docker login muvaffaqiyatsiz tugadi." -ForegroundColor Red
        exit 1
    }
}

$BackendImage = "${Username}/nextolymp-backend:${Tag}"
$FrontendImage = "${Username}/nextolymp-frontend:${Tag}"

$BuildArgs = @()
if ($NoCache) {
    $BuildArgs += "--no-cache"
}

# ─────────────────────────────────────────────
# Backend
# ─────────────────────────────────────────────
if (-not $FrontendOnly) {
    Write-Host "[1/4] Backend image build qilinmoqda..." -ForegroundColor Cyan
    Write-Host "      $BackendImage" -ForegroundColor DarkGray

    $startBE = Get-Date
    docker build @BuildArgs -t $BackendImage ./go-backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Backend build muvaffaqiyatsiz tugadi." -ForegroundColor Red
        exit 1
    }
    $durationBE = (Get-Date) - $startBE
    Write-Host "[OK] Backend tayyor ($([int]$durationBE.TotalSeconds)s)" -ForegroundColor Green
    Write-Host ""

    Write-Host "[2/4] Backend image push qilinmoqda Docker Hub'ga..." -ForegroundColor Cyan
    docker push $BackendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Backend push muvaffaqiyatsiz tugadi." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Backend push tayyor" -ForegroundColor Green
    Write-Host ""
}

# ─────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────
if (-not $BackendOnly) {
    Write-Host "[3/4] Frontend image build qilinmoqda..." -ForegroundColor Cyan
    Write-Host "      $FrontendImage" -ForegroundColor DarkGray

    $startFE = Get-Date
    docker build @BuildArgs `
        --build-arg NEXT_PUBLIC_API_URL=https://nextolymp.uz/api/v1 `
        -t $FrontendImage ./frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Frontend build muvaffaqiyatsiz tugadi." -ForegroundColor Red
        exit 1
    }
    $durationFE = (Get-Date) - $startFE
    Write-Host "[OK] Frontend tayyor ($([int]$durationFE.TotalSeconds)s)" -ForegroundColor Green
    Write-Host ""

    Write-Host "[4/4] Frontend image push qilinmoqda Docker Hub'ga..." -ForegroundColor Cyan
    docker push $FrontendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Frontend push muvaffaqiyatsiz tugadi." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Frontend push tayyor" -ForegroundColor Green
    Write-Host ""
}

# ─────────────────────────────────────────────
# Tayyor
# ─────────────────────────────────────────────
Write-Host "=========================================" -ForegroundColor Green
Write-Host " HAMMASI TAYYOR!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Endi serverda quyidagini ishga tushiring:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   cd /opt/nextolymp" -ForegroundColor White
Write-Host "   ./scripts/server-update.sh" -ForegroundColor White
Write-Host ""
Write-Host " Yoki qisqaroq:" -ForegroundColor Yellow
Write-Host "   cd /opt/nextolymp && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d" -ForegroundColor White
Write-Host ""
