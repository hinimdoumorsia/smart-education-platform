# Étape 1 : build Maven uniquement pour le backend
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copier uniquement les fichiers du backend
COPY smarthub-backend/pom.xml pom.xml
COPY smarthub-backend/src ./src

# Build Maven
RUN mvn clean package -DskipTests

# Étape 2 : runtime Java
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copier le JAR du backend depuis l'étape build
COPY --from=build /app/target/*.jar app.jar

# Port exposé
EXPOSE 8081

# Commande pour lancer l'application
CMD ["java", "-jar", "app.jar"]
