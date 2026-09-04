@echo off
chcp 65001 > nul
echo ========================================================
echo   Публикация «Арены переговоров» на GitHub
echo ========================================================
echo.

cd /d "%~dp0"

echo Выберите способ публикации:
echo [1] Автоматически через GitHub CLI (создать новый репозиторий)
echo [2] Привязать к существующей ссылке на GitHub
echo.
set /p choice="Ваш выбор (1 или 2): "

if "%choice%"=="1" (
    echo.
    echo [1/2] Авторизация в GitHub (в браузере откроется окно подтверждения)...
    "C:\Program Files\GitHub CLI\gh.exe" auth login --web -h github.com
    echo.
    echo [2/2] Создание репозитория и отправка кода...
    "C:\Program Files\GitHub CLI\gh.exe" repo create negotiation-arena --public --source=. --remote=origin --push
) else (
    echo.
    set /p repo_url="Введите URL репозитория (например: https://github.com/ВАШ_ЛОГИН/arena.git): "
    "C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
    "C:\Program Files\Git\cmd\git.exe" remote add origin %repo_url%
    "C:\Program Files\Git\cmd\git.exe" branch -M main
    "C:\Program Files\Git\cmd\git.exe" push -u origin main
)

echo.
echo ========================================================
echo   УСПЕХ! Проект опубликован на GitHub.
echo.
echo   КАК ВКЛЮЧИТЬ САЙТ ОНЛАЙН (GitHub Pages), чтобы любой мог открыть:
echo   1. Зайдите в ваш репозиторий на github.com
echo   2. Перейдите во вкладку Settings -^> Pages (слева в меню)
echo   3. В блоке 'Build and deployment' выберите:
echo      - Source: Deploy from a branch
echo      - Branch: main (или master), папка: / (root)
echo   4. Нажмите Save
echo.
echo   Через 1-2 минуты сайт станет доступен по ссылке:
echo   https://ВАШ_ЛОГИН.github.io/negotiation-arena/
echo ========================================================
echo.
pause
