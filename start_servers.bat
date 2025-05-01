@echo off
echo Starting Backend Server...
cd sources\servidorNode
start cmd /k "node --watch app.js"

echo Starting Angular Frontend...
cd ..\frontendAngular
start cmd /k "ng serve"

echo Servers are starting...