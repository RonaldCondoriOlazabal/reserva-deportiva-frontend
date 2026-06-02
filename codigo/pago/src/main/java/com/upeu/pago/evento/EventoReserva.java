package com.upeu.pago.evento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoReserva {

    private String tipoEvento;
    private Long reservaId;
    private Long idUsuario;
    private Long idCancha;
    private Long idHorario;
    private BigDecimal monto;
    private String estado;
    private String origen;
    private Long timestamp;
}
