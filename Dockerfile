# Étape 1 : Construction de l'application (Build stage)
FROM node:20-alpine AS build-stage

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances en premier pour optimiser le cache Docker
COPY package.json package-lock.json ./

# Installation des dépendances (npm ci est plus sûr et rapide que npm install pour les environnements de CI/CD)
RUN npm ci

# Copie du reste du code source
COPY . .

# Compilation de l'application (génère le dossier /dist)
RUN npm run build

# Étape 2 : Serveur web (Production stage)
FROM nginx:alpine AS production-stage

# Copie de notre configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Récupération des fichiers compilés depuis l'étape 1
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exposition du port 80
EXPOSE 80

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]