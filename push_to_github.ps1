# PowerShell script to push project to GitHub
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$gitPath = "C:\Program Files\Git\cmd\git.exe"
$ghPath = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Публикация «Арены переговоров» на GitHub" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Выберите способ:"
Write-Host "[1] Автоматически через GitHub CLI (создать новый репозиторий)" -ForegroundColor Yellow
Write-Host "[2] Привязать к существующей ссылке на GitHub" -ForegroundColor Yellow
Write-Host ""
$choice = Read-Host "Ваш выбор (1 или 2)"

if ($choice -eq "1") {
    Write-Host "`n[1/2] Авторизация в GitHub..." -ForegroundColor Cyan
    & $ghPath auth login --web -h github.com
    Write-Host "`n[2/2] Создание публичного репозитория negotiation-arena..." -ForegroundColor Cyan
    & $ghPath repo create negotiation-arena --public --source=. --remote=origin --push
} else {
    $url = Read-Host "`nВведите URL репозитория (например: https://github.com/USER/negotiation-arena.git)"
    & $gitPath remote remove origin 2>$null
    & $gitPath remote add origin $url
    & $gitPath branch -M main
    & $gitPath push -u origin main
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Проект отправлен на GitHub!" -ForegroundColor Green
Write-Host "  КАК СДЕЛАТЬ САЙТ ОНЛАЙН ДЛЯ ВСЕХ (GitHub Pages):" -ForegroundColor Cyan
Write-Host "  1. Откройте ваш репозиторий на github.com"
Write-Host "  2. Перейдите в Settings -> Pages"
Write-Host "  3. Выберите Source: 'Deploy from a branch', Branch: 'main', Folder: '/ (root)'"
Write-Host "  4. Нажмите Save"
Write-Host "`n  Через 1-2 минуты сайт откроется по адресу:" -ForegroundColor Yellow
Write-Host "  https://ВАШ_ЛОГИН.github.io/negotiation-arena/" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
