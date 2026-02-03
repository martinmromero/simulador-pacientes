@echo off
cd frontend
echo Iniciando Frontend en puerto 8080...
npx http-server -p 8080 -c-1 --cors
pause
