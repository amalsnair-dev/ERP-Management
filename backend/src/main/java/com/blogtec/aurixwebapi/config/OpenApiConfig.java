package com.blogtec.aurixwebapi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AURIX Web API Suite")
                        .version("1.0.0")
                        .description("High-Performance Backend REST APIs for AURIX ERP & Customer Management")
                        .contact(new Contact().name("BlogTec Software LLP").email("support@blogtec.co.in"))
                        .license(new License().name("Proprietary").url("https://blogtec.co.in")));
    }
}

