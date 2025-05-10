FROM node:18

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias y solucionar el problema de bcrypt
RUN npm install && \
    npm uninstall bcrypt && \
    npm install bcrypt

# Copiar el código fuente
COPY . .

# Configurar variables de entorno para Docker
COPY .env.docker .env

# Exponer el puerto que utiliza la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]