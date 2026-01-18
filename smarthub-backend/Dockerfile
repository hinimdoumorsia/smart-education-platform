# =========================
# Étape 1 : Build Maven
# =========================
FROM maven:3.9.9-eclipse-temurin-21 AS build

# On se place dans le dossier de travail
WORKDIR /app

# On copie uniquement le backend (pom.xml + src)
COPY pom.xml .
COPY src ./src

# Build du projet sans lancer les tests
RUN mvn clean package -DskipTests

# =========================
# Étape 2 : Runtime Java
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# On récupère le jar construit dans l'étape précédente
COPY --from=build /app/target/*.jar app.jar

# Port exposé pour Render
EXPOSE 8081

# Commande pour lancer l'application
CMD ["java", "-jar", "app.jar"]
