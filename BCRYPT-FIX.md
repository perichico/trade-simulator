# Solución al Error de bcrypt en Docker

## Problema

Se detectaron dos problemas relacionados con bcrypt:

1. Error al cargar la biblioteca compartida de bcrypt:
```
Error: Error loading shared library /app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: Exec format error
```

2. Error de módulo no encontrado para bcryptjs:
```
Error: Cannot find module 'bcryptjs'
```

## Solución Implementada

### 1. Compatibilidad de Arquitectura
- Se cambió la imagen base de `node:18-alpine` a `node:18` (basada en Debian)
- Se agregaron herramientas de construcción necesarias (python3, make, g++)
- Se implementó recompilación de bcrypt para la arquitectura del contenedor

### 2. Dependencias Consistentes
- Se añadió `bcryptjs` como dependencia alternativa
- Se mantuvo `bcrypt` como dependencia principal
- Se corrigieron las importaciones en el código

## Pasos para Aplicar la Solución

1. Detener contenedores actuales:
   ```bash
   docker-compose down
   ```

2. Limpiar imágenes y volúmenes:
   ```bash
   docker system prune -f
   docker volume prune -f
   ```

3. Reconstruir sin caché:
   ```bash
   docker-compose build --no-cache
   ```

4. Iniciar contenedores:
   ```bash
   docker-compose up -d
   ```

## Verificación

Revisar logs para confirmar que no hay errores:
```bash
docker logs trade-simulator-node
```

## Alternativas

Si persisten problemas, el código puede usar bcryptjs como alternativa:
```javascript
const bcrypt = require("bcryptjs");
```

## Notas Técnicas

- La imagen Debian es más pesada pero más compatible con módulos nativos
- La recompilación asegura compatibilidad con la arquitectura del contenedor
- Se mantienen ambas librerías para máxima compatibilidad