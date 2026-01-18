# Étape 1 : Build Maven du backend
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copier uniquement le contenu du dossier backend
COPY ./smarthub-backend /app

# Build du projet backend
RUN mvn clean package -DskipTests

# Étape 2 : runtime Java
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copier le jar buildé depuis l'étape 1
COPY --from=build /app/target/*.jar app.jar

# Exposer le port sur lequel Spring Boot écoute
EXPOSE 8081

# Lancer l'application
CMD ["java", "-jar", "app.jar"]
