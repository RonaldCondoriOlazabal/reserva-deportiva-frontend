package com.upeu.reservas.client;

import com.upeu.reservas.dto.HorarioDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "horarios", fallback = HorariosClient.Fallback.class)
public interface HorariosClient {
    @GetMapping("/api/v1/horarios/{id}")
    HorarioDto findHorarioById(@PathVariable("id") Long id);

    @Component
    @Slf4j
    class Fallback implements HorariosClient {
        @Override
        public HorarioDto findHorarioById(Long id) {
            log.warn("Fallback horarios activado. idHorario={}", id);
            return HorarioDto.builder()
                    .id(id)
                    .idCancha(0L)
                    .fecha("NO DISPONIBLE")
                    .horaInicio("NO DISPONIBLE")
                    .horaFin("NO DISPONIBLE")
                    .disponible(false)
                    .build();
        }
    }
}

