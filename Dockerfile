# ---- Etapa 1: Compilación ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache de dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Código fuente y compilación
COPY src ./src
RUN mvn clean package -DskipTests

# ---- Etapa 2: Imagen final ----
FROM eclipse-temurin:21-jre-jammy

# Seguridad: usuario no-root
RUN groupadd -r elarca && useradd -r -g elarca -m -d /app elarca

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Directorio de uploads
RUN mkdir -p /app/uploads /app/uploads/galeria /app/uploads/recuerdos /app/uploads/musica && \
    chown -R elarca:elarca /app

USER elarca

# Render asigna el puerto mediante la variable de entorno PORT
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-8080}/api/v1/health || exit 1

ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseZGC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
