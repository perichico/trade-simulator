#!/bin/bash
echo "==================================================="
echo "   INICIANDO CONTENEDORES DOCKER TRADE SIMULATOR"
echo "==================================================="
echo

echo "Verificando si Docker está en ejecución..."
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker no está en ejecución. Por favor, inicie Docker."
    echo
    read -p "Presione Enter para continuar..."
    exit 1
fi

echo "Construyendo e iniciando contenedores..."
docker-compose up -d --build

echo
echo "Esperando a que los servicios estén listos..."
sleep 15

echo
echo "Configurando entornos con IPs de contenedores..."

# Obtener IPs de los contenedores
ANGULAR_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-angular)
NODE_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-node)
MYSQL_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-mysql)

# Actualizar environment.docker.ts para Angular
echo "Configurando entorno para Angular..."
cat > ./sources/frontendAngular/src/environments/environment.docker.ts << EOF
export const environment = {
  production: false,
  apiUrl: 'http://${NODE_IP}:3000'
};
EOF

# Actualizar .env.docker para Node.js
echo "Configurando entorno para Node.js..."
cat > ./sources/servidorNode/.env.docker << EOF
# Variables de entorno para el servidor Node.js en Docker
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=${MYSQL_IP}
DB_USER=usuario
DB_PASSWORD=password
DB_NAME=Bolsa
DB_PORT=3306

# Puerto del servidor
PORT=3000

# Configuración de CORS
CORS_ORIGIN=http://${ANGULAR_IP}:4200
EOF

# Reiniciar los contenedores para aplicar los cambios
echo "Reiniciando contenedores para aplicar los cambios..."
docker-compose restart

echo
echo "==================================================="
echo "   SERVICIOS DISPONIBLES:"
echo "==================================================="
echo
echo "Obteniendo IPs de los contenedores..."

# Actualizar IPs después del reinicio
ANGULAR_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-angular)
NODE_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-node)
MYSQL_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" trade-simulator-mysql)

echo "Frontend Angular: http://${ANGULAR_IP}:4200"
echo "Backend Node.js: http://${NODE_IP}:3000"
echo "Base de datos MySQL: ${MYSQL_IP}:3306 (usuario: usuario, contraseña: password)"
echo
echo "Nota: También puede acceder usando localhost en los mismos puertos."
echo
echo "Para detener los contenedores ejecute: docker-compose down"
echo "==================================================="

read -p "Presione Enter para continuar..."

# chmod +x start-docker.sh