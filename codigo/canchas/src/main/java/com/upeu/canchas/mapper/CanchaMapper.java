package com.upeu.canchas.mapper;

import com.upeu.canchas.dto.CanchaRequest;
import com.upeu.canchas.dto.CanchaResponse;
import com.upeu.canchas.entity.Cancha;
import org.springframework.stereotype.Component;

@Component
public class CanchaMapper {
    public Cancha toEntity(CanchaRequest request) {
        return Cancha.builder()
                .nombre(request.getNombre())
                .ubicacion(request.getUbicacion())
                .tipo(request.getTipo())
                .activa(request.getActiva())
                .build();
    }

    public void updateEntityFromRequest(Cancha entity, CanchaRequest request) {
        entity.setNombre(request.getNombre());
        entity.setUbicacion(request.getUbicacion());
        entity.setTipo(request.getTipo());
        entity.setActiva(request.getActiva());
    }

    public CanchaResponse toResponse(Cancha entity) {
        return CanchaResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .ubicacion(entity.getUbicacion())
                .tipo(entity.getTipo())
                .activa(entity.getActiva())
                .build();
    }
}

