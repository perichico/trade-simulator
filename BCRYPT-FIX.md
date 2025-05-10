# Solución al Error de bcrypt en Docker

## Problema

Se ha detectado un error al cargar la biblioteca compartida de bcrypt en el contenedor Docker:

```
Error: Error loading shared library /app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: Exec format error
```

Este error ocurre debido a una incompatibilidad de arquitectura entre la biblioteca compilada de bcrypt y la arquitectura del contenedor Docker.

## Solución Implementada

Se ha modificado el Dockerfile del servidor Node.js para utilizar una imagen base más compatible y mejorar el proceso de compilación de bcrypt:

1. Se cambió la imagen base de `node:18-alpine` a `node:18` (basada en Debian)
2. Se optimizó el proceso de instalación de dependencias

## Pasos para Aplicar la Solución

1. Asegúrese de que Docker esté en ejecución
2. Detenga los contenedores actuales:
   ```
   docker-compose down
   ```
3. Reconstruya la imagen del servidor Node.js:
   ```
   docker-compose build --no-cache node
   ```
4. Inicie los contenedores nuevamente:
   ```
   docker-compose up -d
   ```

## Verificación

Para verificar que el problema se ha resuelto, puede revisar los logs del contenedor Node.js:

```
docker logs trade-simulator-node
```

Ya no debería aparecer el error relacionado con bcrypt.

## Notas Adicionales

- La nueva imagen base es más grande que la versión Alpine, pero ofrece mejor compatibilidad con módulos nativos como bcrypt
- Si experimenta problemas adicionales, considere utilizar una versión específica de bcrypt compatible con su entorno