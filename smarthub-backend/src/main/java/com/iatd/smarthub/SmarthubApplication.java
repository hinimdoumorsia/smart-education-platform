package com.iatd.smarthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

// SUPPRIMEZ toutes les annotations personnalisées, gardez SEULEMENT ça :
@SpringBootApplication
public class SmarthubApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmarthubApplication.class, args);
    }
}