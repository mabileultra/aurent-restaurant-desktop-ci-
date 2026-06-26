FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY shared-kernel shared-kernel
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY web-backend/pom.xml web-backend/pom.xml
COPY finance-service/pom.xml finance-service/pom.xml
COPY identity-service/pom.xml identity-service/pom.xml
COPY platform-service/pom.xml platform-service/pom.xml
COPY reporting-service/pom.xml reporting-service/pom.xml
RUN mvn -pl shared-kernel,finance-service -am dependency:go-offline -q

COPY finance-service/src finance-service/src
RUN mvn -pl finance-service -am package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache wget

COPY --from=build /app/finance-service/target/finance-service-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
