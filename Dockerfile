# Utiliser l'image nginx alpine pour un container léger
FROM nginx:alpine

# Copier les fichiers du projet vers le dossier de nginx
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY kinks-data.js /usr/share/nginx/html/

# Copier une configuration nginx personnalisée (optionnel)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
