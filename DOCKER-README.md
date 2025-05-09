# Guía de Configuración Docker para Trade Simulator

## Descripción General

Esta configuración Docker permite ejecutar todos los componentes del Trade Simulator en contenedores aislados, facilitando el despliegue y la ejecución del sistema completo sin necesidad de instalar dependencias adicionales en el sistema host.

## Componentes

- **MySQL**: Base de datos para almacenar información de usuarios, activos, transacciones y portafolios.
- **Node.js**: Backend que proporciona la API REST para la aplicación.
- **Angular**: Frontend que ofrece la interfaz de usuario.

## Requisitos Previos

- Docker Desktop instalado y en ejecución
- Puerto 3000, 3306 y 4200 disponibles en el sistema host

## Instrucciones de Uso

### Iniciar los Contenedores

1. Ejecute el script `start-docker.bat` incluido en el proyecto:
   ```
   start-docker.bat
   ```

2. El script verificará que Docker esté en ejecución, construirá las imágenes necesarias e iniciará los contenedores.

3. Espere aproximadamente 15 segundos para que todos los servicios estén disponibles.

### Acceder a los Servicios

- **Frontend Angular**: http://localhost:4200
- **Backend Node.js**: http://localhost:3000
- **Base de datos MySQL**: localhost:3306 (usuario: usuario, contraseña: password)

### Detener los Contenedores

Para detener todos los contenedores, ejecute:
```
docker-compose down
```

## Solución de Problemas

### El Frontend no puede conectarse al Backend

Verifique que la configuración CORS en el backend esté correctamente configurada. El archivo `.env.docker` del backend debe tener la variable `CORS_ORIGIN` configurada como `http://angular:4200` para comunicación entre contenedores.

### La Base de Datos no se Inicializa Correctamente

Verifique que los archivos SQL de inicialización estén en la carpeta correcta (`./sources/servidorNode/database/`) y que tengan los permisos adecuados.

### Cambios en el Código no se Reflejan

Los volúmenes bind mount permiten que los cambios en el código fuente se reflejen automáticamente en los contenedores. Si los cambios no se reflejan:

1. Reinicie los contenedores: `docker-compose restart`
2. Si persiste el problema, reconstruya las imágenes: `docker-compose up -d --build`

## Estructura de Archivos Docker

- `docker-compose.yml`: Configuración principal de los servicios
- `sources/servidorNode/Dockerfile`: Configuración para construir la imagen del backend
- `sources/frontendAngular/Dockerfile`: Configuración para construir la imagen del frontend
- `sources/servidorNode/database/`: Contiene los scripts SQL para inicializar la base de datos
- `sources/servidorNode/.env.docker`: Variables de entorno para el backend en Docker

## Notas Adicionales

- Los datos de MySQL se persisten en un volumen Docker llamado `mysql_data`
- Los contenedores están configurados para reiniciarse automáticamente en caso de fallo
- El backend espera a que MySQL esté disponible antes de iniciar gracias a la configuración de healthcheck