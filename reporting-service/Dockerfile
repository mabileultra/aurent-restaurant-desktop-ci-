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
COPY crm-service/pom.xml crm-service/pom.xml
RUN mvn -pl shared-kernel,reporting-service -am dependency:go-offline -q

COPY reporting-service/src reporting-service/src
RUN mvn -pl reporting-service -am package -DskipTests -q

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && groupadd -r pos && useradd -r -g pos pos \
  && rm -rf /var/lib/apt/lists/*

USER pos

COPY --from=build /app/reporting-service/target/reporting-service-1.0.0.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
