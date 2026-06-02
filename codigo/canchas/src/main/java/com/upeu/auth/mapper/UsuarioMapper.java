package com.upeu.auth.mapper;

import com.upeu.auth.dto.UsuarioRequest;
import com.upeu.auth.dto.UsuarioResponse;
import com.upeu.auth.entity.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {
    public Usuario toEntity(UsuarioRequest request) {
        return Usuario.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword())
                .rol(request.getRol())
                .activo(request.getActivo())
                .build();
    }

    public void updateEntityFromRequest(Usuario entity, UsuarioRequest request) {
        entity.setUsername(request.getUsername());
        entity.setEmail(request.getEmail());
        entity.setPassword(request.getPassword());
        entity.setRol(request.getRol());
        entity.setActivo(request.getActivo());
    }

    public UsuarioResponse toResponse(Usuario entity) {
        return UsuarioResponse.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .rol(entity.getRol())
                .activo(entity.getActivo())
                .build();
    }
}

