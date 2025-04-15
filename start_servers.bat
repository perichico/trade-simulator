@echo off
echo Starting Backend Server...
cd c:\Users\perif\Documents\GitHub\trade-simulator\sources\servidorNode
start cmd /k "node --watch app.js"

echo Starting Angular Frontend...
cd c:\Users\perif\Documents\GitHub\trade-simulator\sources\frontendAngular
start cmd /k "ng serve"

echo Servers are starting...