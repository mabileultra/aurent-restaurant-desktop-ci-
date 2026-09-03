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
COPY ai-service/pom.xml ai-service/pom.xml
COPY crm-service/pom.xml crm-service/pom.xml
COPY restaurant-service/pom.xml restaurant-service/pom.xml
RUN mvn -pl shared-kernel,api-gateway -am dependency:go-offline -q

COPY api-gateway/src api-gateway/src
RUN mvn -pl api-gateway -am package -DskipTests -q

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && groupadd -r gateway && useradd -r -g gateway gateway \
  && rm -rf /var/lib/apt/lists/*

USER gateway

COPY --from=build /app/api-gateway/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
