FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# CHANGE : Utilise l'image FULL JDK au lieu de JRE
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Ajoute Java au PATH explicitement
ENV PATH="/opt/java/openjdk/bin:${PATH}"

EXPOSE 8080
# Utilise SHELL FORM au lieu de EXEC FORM
ENTRYPOINT java -jar app.jar
