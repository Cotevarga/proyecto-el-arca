package com.elarca.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int port;

    @Bean
    public OpenAPI elArcaOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("API El Arca — Archivo Comunitario")
                .description("API REST del memorial de Pedro \"Cabezón Jano\" González. " +
                    "Arquitectura hexagonal con Spring Boot 3 + Java 21.")
                .version("2.0.0")
                .contact(new Contact()
                    .name("El Arca")
                    .email("archivo.elarca@gmail.com")
                    .url("https://proyecto-el-arca.vercel.app"))
                .license(new License()
                    .name("MIT")
                    .url("https://opensource.org/licenses/MIT")))
            .servers(List.of(
                new Server().url("http://localhost:" + port).description("Desarrollo local"),
                new Server().url("https://proyecto-el-arca.vercel.app").description("Producción")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .name("bearerAuth")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Token JWT obtenido de /api/v1/auth/login")));
    }
}
