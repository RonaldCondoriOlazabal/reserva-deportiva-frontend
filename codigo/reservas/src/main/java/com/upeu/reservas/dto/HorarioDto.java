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
public class HorarioDto {
    private Long id;
    private Long idCancha;
    private String fecha;
    private String horaInicio;
    private String horaFin;
    private Boolean disponible;
}

