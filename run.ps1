# PowerShell launcher for Negotiation Arena
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Арена переговоров: ИИ-оппонент Spark (Хакатон ЛЦТ 2026)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[1/2] Проверка зависимостей..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --quiet

Write-Host ""
Write-Host "[2/2] Запуск веб-сервера FastAPI..." -ForegroundColor Yellow
Write-Host "Приложение доступно по адресу: http://localhost:8000" -ForegroundColor Green
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Gray
Write-Host ""

python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
