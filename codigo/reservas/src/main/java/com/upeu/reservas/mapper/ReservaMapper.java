package com.upeu.reservas.mapper;

import com.upeu.reservas.dto.ReservaRequest;
import com.upeu.reservas.dto.ReservaResponse;
import com.upeu.reservas.entity.Reserva;
import org.springframework.stereotype.Component;

@Component
public class ReservaMapper {
    public Reserva toEntity(ReservaRequest request) {
        return Reserva.builder()
                .idUsuario(request.getIdUsuario())
                .idCancha(request.getIdCancha())
                .idHorario(request.getIdHorario())
                .fechaReserva(request.getFechaReserva())
                .estado(request.getEstado())
                .build();
    }

    public void updateEntityFromRequest(Reserva entity, ReservaRequest request) {
        entity.setIdUsuario(request.getIdUsuario());
        entity.setIdCancha(request.getIdCancha());
        entity.setIdHorario(request.getIdHorario());
        entity.setFechaReserva(request.getFechaReserva());
        entity.setEstado(request.getEstado());
    }

    public ReservaResponse toResponse(Reserva entity) {
        return ReservaResponse.builder()
                .id(entity.getId())
                .idUsuario(entity.getIdUsuario())
                .idCancha(entity.getIdCancha())
                .idHorario(entity.getIdHorario())
                .fechaReserva(entity.getFechaReserva())
                .estado(entity.getEstado())
                .build();
    }
}

