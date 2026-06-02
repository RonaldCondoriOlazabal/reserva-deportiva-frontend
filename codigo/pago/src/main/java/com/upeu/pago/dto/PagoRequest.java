package com.upeu.pago.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoRequest {
    @NotNull
    private Long idReserva;
    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    private BigDecimal monto;
    @NotBlank
    private String metodoPago;
    @NotBlank
    private String estado;
    @NotBlank
    private String fechaPago;
    private String referencia;
}
