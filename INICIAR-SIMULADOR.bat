@echo off
title Simulador de Pacientes - Iniciador
color 0A
echo ========================================
echo   SIMULADOR DE PACIENTES VIRTUALES
echo ========================================
echo.
echo Iniciando servicios...
echo.

REM Matar procesos previos
taskkill /F /IM node.exe 2>nul

REM Esperar un momento
timeout /t 2 /nobreak >nul

REM Iniciar backend
echo [1/2] Iniciando Backend (Puerto 3000)...
start "Backend - Puerto 3000" cmd /k "cd backend && node server-simple.js"

REM Esperar que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar frontend
echo [2/2] Iniciando Frontend (Puerto 8080)...
start "Frontend - Puerto 8080" cmd /k "cd frontend && npx --yes http-server -p 8080 -c-1 --cors"

REM Esperar que el frontend inicie
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   SERVICIOS INICIADOS
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8080
echo.
echo Abriendo navegador...
timeout /t 2 /nobreak >nul

REM Abrir navegador
start http://localhost:8080

echo.
echo IMPORTANTE: No cierres las ventanas del Backend y Frontend
echo Para detener: Cierra las ventanas de Backend y Frontend
echo.
pause
