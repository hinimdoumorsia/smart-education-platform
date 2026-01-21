# Dockerfile à la racine de smart-education-platform
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY smarthub-backend/pom.xml .
RUN mvn dependency:go-offline
COPY smarthub-backend/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
