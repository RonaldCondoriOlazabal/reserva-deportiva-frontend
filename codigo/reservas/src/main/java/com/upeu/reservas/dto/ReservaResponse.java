package com.upeu.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponse {
    private Long id;
    private Long idUsuario;
    private Long idCancha;
    private Long idHorario;
    private String fechaReserva;
    private String estado;
    private CanchaDto cancha;
    private HorarioDto horario;
}

