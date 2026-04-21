package com.upeu.horarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class HorarioRequest {
    @NotNull
    private Long idCancha;
    @NotBlank
    private String fecha;
    @NotBlank
    private String horaInicio;
    @NotBlank
    private String horaFin;
    @NotNull
    private Boolean disponible;
}

