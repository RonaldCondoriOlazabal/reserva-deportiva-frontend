package com.upeu.reservas.dto;

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
public class ReservaRequest {
    @NotNull
    private Long idUsuario;
    @NotNull
    private Long idCancha;
    @NotNull
    private Long idHorario;
    @NotBlank
    private String fechaReserva;
    @NotBlank
    private String estado;
}

