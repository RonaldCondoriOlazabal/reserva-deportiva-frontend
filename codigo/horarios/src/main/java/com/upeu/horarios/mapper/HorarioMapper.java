package com.upeu.horarios.mapper;

import com.upeu.horarios.dto.HorarioRequest;
import com.upeu.horarios.dto.HorarioResponse;
import com.upeu.horarios.entity.Horario;
import org.springframework.stereotype.Component;

@Component
public class HorarioMapper {
    public Horario toEntity(HorarioRequest request) {
        return Horario.builder()
                .idCancha(request.getIdCancha())
                .fecha(request.getFecha())
                .horaInicio(request.getHoraInicio())
                .horaFin(request.getHoraFin())
                .disponible(request.getDisponible())
                .build();
    }

    public void updateEntityFromRequest(Horario entity, HorarioRequest request) {
        entity.setIdCancha(request.getIdCancha());
        entity.setFecha(request.getFecha());
        entity.setHoraInicio(request.getHoraInicio());
        entity.setHoraFin(request.getHoraFin());
        entity.setDisponible(request.getDisponible());
    }

    public HorarioResponse toResponse(Horario entity) {
        return HorarioResponse.builder()
                .id(entity.getId())
                .idCancha(entity.getIdCancha())
                .fecha(entity.getFecha())
                .horaInicio(entity.getHoraInicio())
                .horaFin(entity.getHoraFin())
                .disponible(entity.getDisponible())
                .build();
    }
}

