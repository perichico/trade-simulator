FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Configurar para usar el entorno Docker
RUN cp -f src/environments/environment.docker.ts src/environments/environment.ts

# Exponer el puerto que utiliza la aplicación
EXPOSE 4200

# Comando para iniciar el servidor de desarrollo de Angular
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--disable-host-check"]