package com.upeu.canchas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/canchas")
public class GatewayInstanciasController {

    private final Environment environment;

    @GetMapping("/instancia")
    public Map<String, String> instancia() {
        return Map.of(
                "app", environment.getProperty("spring.application.name", "canchas"),
                "port", environment.getProperty("local.server.port", "N/A"),
                "host", obtenerHost()
        );
    }

    private String obtenerHost() {
        String hostname = environment.getProperty("HOSTNAME");
        if (hostname != null && !hostname.isBlank()) return hostname;

        String computerName = environment.getProperty("COMPUTERNAME");
        if (computerName != null && !computerName.isBlank()) return computerName;

        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "desconocido";
        }
    }
}

