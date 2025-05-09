FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias para compilación
RUN apk add --no-cache bash python3 make g++ gcc

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias y reconstruir bcrypt para la arquitectura del contenedor
RUN npm install && npm rebuild bcrypt --build-from-source

# Copiar el código fuente
COPY . .

# Exponer el puerto que utiliza la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]