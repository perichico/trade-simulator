FROM node:18

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias del sistema necesarias para bcrypt
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias y recompilar bcrypt para la arquitectura del contenedor
RUN npm install && \
    npm rebuild bcrypt --build-from-source

# Copiar el código fuente
COPY . .

# Configurar variables de entorno para Docker
COPY .env.docker .env

# Exponer el puerto que utiliza la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]