@echo off
echo ===================================================
echo    INICIANDO CONTENEDORES DOCKER TRADE SIMULATOR
echo ===================================================
echo.

echo Verificando si Docker está en ejecución...
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no está en ejecución. Por favor, inicie Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo Construyendo e iniciando contenedores...
docker-compose up -d --build

echo.
echo Esperando a que los servicios estén listos...
timeout /t 15 /nobreak > nul

echo.
echo Configurando entornos con IPs de contenedores...

:: Convertir el script setup-env.sh a formato Windows
FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-angular') DO SET ANGULAR_IP=%%a
FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-node') DO SET NODE_IP=%%a
FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-mysql') DO SET MYSQL_IP=%%a

:: Actualizar environment.docker.ts para Angular
echo Configurando entorno para Angular...
(echo export const environment = {
echo   production: false,
echo   apiUrl: 'http://%NODE_IP%:3000'
echo };) > .\sources\frontendAngular\src\environments\environment.docker.ts

:: Actualizar .env.docker para Node.js
echo Configurando entorno para Node.js...
(echo # Variables de entorno para el servidor Node.js en Docker
echo NODE_ENV=development
echo.
echo # Configuración de la base de datos
echo DB_HOST=%MYSQL_IP%
echo DB_USER=usuario
echo DB_PASSWORD=password
echo DB_NAME=Bolsa
echo DB_PORT=3306
echo.
echo # Puerto del servidor
echo PORT=3000
echo.
echo # Configuración de CORS
echo CORS_ORIGIN=http://%ANGULAR_IP%:4200) > .\sources\servidorNode\.env.docker

:: Reiniciar los contenedores para aplicar los cambios
echo Reiniciando contenedores para aplicar los cambios...
docker-compose restart

echo.
echo ===================================================
echo    SERVICIOS DISPONIBLES:
echo ===================================================
echo.
echo Obteniendo IPs de los contenedores...

FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-angular') DO SET ANGULAR_IP=%%a
FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-node') DO SET NODE_IP=%%a
FOR /F "tokens=*" %%a IN ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-mysql') DO SET MYSQL_IP=%%a

echo Frontend Angular: http://%ANGULAR_IP%:4200
echo Backend Node.js: http://%NODE_IP%:3000
echo Base de datos MySQL: %MYSQL_IP%:3306 (usuario: usuario, contraseña: password)
echo.
echo Nota: También puede acceder usando localhost en los mismos puertos.
echo.
echo Para detener los contenedores ejecute: docker-compose down
echo ===================================================

pause