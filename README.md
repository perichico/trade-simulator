# Trade Simulator - Configuración Docker

Este proyecto utiliza Docker para crear un entorno de desarrollo consistente con tres contenedores:

- **MySQL**: Base de datos para almacenar la información del simulador de trading
- **Node.js**: Backend que proporciona la API REST
- **Angular**: Frontend que ofrece la interfaz de usuario

## Requisitos previos

- Docker y Docker Compose instalados en tu sistema
- Git para clonar el repositorio (opcional)

## Estructura de contenedores

La configuración incluye:

- **3 contenedores**: MySQL, Node.js y Angular
- **2 redes Docker**: 
  - `backend_network`: Conecta MySQL con Node.js
  - `frontend_network`: Conecta Node.js con Angular
- **Volúmenes bind mount**: Para persistir datos y código fuente

## Instrucciones de uso

### 1. Iniciar los contenedores

```bash
docker-compose up -d
```

Esto construirá las imágenes (si es necesario) e iniciará los tres contenedores en modo detached.

### 2. Verificar el estado de los contenedores

```bash
docker-compose ps
```

### 3. Acceder a las aplicaciones

- **Frontend Angular**: http://localhost:4200
- **Backend Node.js**: http://localhost:3000
- **Base de datos MySQL**: localhost:3306 (accesible mediante herramientas como MySQL Workbench)

### 4. Ver logs de los contenedores

```bash
# Ver logs de todos los contenedores
docker-compose logs

# Ver logs de un contenedor específico
docker-compose logs mysql
docker-compose logs node
docker-compose logs angular
```

### 5. Detener los contenedores

```bash
docker-compose down
```

Para eliminar también los volúmenes (esto borrará los datos persistentes):

```bash
docker-compose down -v
```

## Configuración personalizada

Puedes modificar las variables de entorno y otras configuraciones en el archivo `docker-compose.yml`.

## Desarrollo

Gracias a los volúmenes bind mount, puedes modificar el código fuente en tu máquina local y los cambios se reflejarán automáticamente en los contenedores:

- El código del backend se encuentra en `./sources/servidorNode`
- El código del frontend se encuentra en `./sources/frontendAngular`

## Solución de problemas

Si encuentras problemas con los contenedores:

1. Verifica los logs para identificar errores: `docker-compose logs`
2. Reinicia los contenedores: `docker-compose restart`
3. Reconstruye las imágenes: `docker-compose build --no-cache`
4. Elimina los contenedores y vuelve a iniciarlos: `docker-compose down && docker-compose up -d`

## Notas adicionales

- La base de datos MySQL está configurada con las credenciales especificadas en el archivo `docker-compose.yml`
- El backend Node.js espera a que MySQL esté disponible antes de iniciar
- El frontend Angular depende del backend Node.js