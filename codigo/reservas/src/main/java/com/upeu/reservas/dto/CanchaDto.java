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
public class CanchaDto {
    private Long id;
    private String nombre;
    private String ubicacion;
    private String tipo;
    private Boolean activa;
}

