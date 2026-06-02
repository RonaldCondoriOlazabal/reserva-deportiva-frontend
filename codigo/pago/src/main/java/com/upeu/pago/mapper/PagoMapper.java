package com.upeu.pago.mapper;

import com.upeu.pago.dto.PagoRequest;
import com.upeu.pago.dto.PagoResponse;
import com.upeu.pago.entity.Pago;
import org.springframework.stereotype.Component;

@Component
public class PagoMapper {
    public Pago toEntity(PagoRequest request) {
        return Pago.builder()
                .idReserva(request.getIdReserva())
                .monto(request.getMonto())
                .metodoPago(request.getMetodoPago())
                .estado(request.getEstado())
                .fechaPago(request.getFechaPago())
                .referencia(request.getReferencia())
                .build();
    }

    public void updateEntityFromRequest(Pago entity, PagoRequest request) {
        entity.setIdReserva(request.getIdReserva());
        entity.setMonto(request.getMonto());
        entity.setMetodoPago(request.getMetodoPago());
        entity.setEstado(request.getEstado());
        entity.setFechaPago(request.getFechaPago());
        entity.setReferencia(request.getReferencia());
    }

    public PagoResponse toResponse(Pago entity) {
        return PagoResponse.builder()
                .id(entity.getId())
                .idReserva(entity.getIdReserva())
                .monto(entity.getMonto())
                .metodoPago(entity.getMetodoPago())
                .estado(entity.getEstado())
                .fechaPago(entity.getFechaPago())
                .referencia(entity.getReferencia())
                .build();
    }
}
