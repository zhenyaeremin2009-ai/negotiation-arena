@echo off
chcp 65001 > nul
echo ========================================================
echo   Арена переговоров: ИИ-оппонент Spark (Хакатон ЛЦТ 2026)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Проверка зависимостей...
python -m pip install -r requirements.txt --quiet

echo.
echo [2/2] Запуск веб-сервера FastAPI...
echo Приложение доступно по адресу: http://localhost:8000
echo Для остановки нажмите Ctrl+C
echo.

python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
