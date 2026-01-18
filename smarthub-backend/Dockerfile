# Étape 1 : build Maven
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY smarthub-backend/ .  # Copie seulement le backend
RUN mvn clean package -DskipTests

# Étape 2 : runtime Java
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/smarthub1-0.0.1-SNAPSHOT.jar app.jar  # adapte selon le nom du JAR
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]
