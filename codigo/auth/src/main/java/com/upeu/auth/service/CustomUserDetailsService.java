package com.upeu.auth.service;

import com.upeu.auth.entity.Usuario;
import com.upeu.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        String rol = usuario.getRol() != null ? usuario.getRol().toUpperCase() : "USER";
        if (!rol.startsWith("ROLE_")) {
            rol = "ROLE_" + rol;
        }

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .disabled(Boolean.FALSE.equals(usuario.getActivo()))
                .authorities(new SimpleGrantedAuthority(rol))
                .build();
    }
}
