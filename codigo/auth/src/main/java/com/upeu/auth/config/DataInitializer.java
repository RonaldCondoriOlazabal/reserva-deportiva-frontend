package com.upeu.auth.config;

import com.upeu.auth.entity.Usuario;
import com.upeu.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initUsuarios() {
        return args -> {
            if (!usuarioRepository.existsByUsername("admin")) {
                usuarioRepository.save(Usuario.builder()
                        .username("admin")
                        .email("admin@reservas.local")
                        .password(passwordEncoder.encode("admin123"))
                        .rol("ADMIN")
                        .activo(true)
                        .build());
            }

            if (!usuarioRepository.existsByUsername("user")) {
                usuarioRepository.save(Usuario.builder()
                        .username("user")
                        .email("user@reservas.local")
                        .password(passwordEncoder.encode("user123"))
                        .rol("USER")
                        .activo(true)
                        .build());
            }
        };
    }
}
