package com.upeu.canchas.dto;

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
public class CanchaRequest {
    @NotBlank
    private String nombre;
    @NotBlank
    private String ubicacion;
    @NotBlank
    private String tipo;
    @NotNull
    private Boolean activa;
}

