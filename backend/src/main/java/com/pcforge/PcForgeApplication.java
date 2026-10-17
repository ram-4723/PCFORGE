package com.pcforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PcForgeApplication {
    public static void main(String[] args) {
        SpringApplication.run(PcForgeApplication.class, args);
    }
}
