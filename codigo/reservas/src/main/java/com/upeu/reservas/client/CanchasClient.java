package com.upeu.reservas.client;

import com.upeu.reservas.dto.CanchaDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "canchas-ms", fallback = CanchasClient.Fallback.class)
public interface CanchasClient {
    @GetMapping("/api/v1/canchas/{id}")
    CanchaDto findCanchaById(@PathVariable("id") Long id);

    @Component
    @Slf4j
    class Fallback implements CanchasClient {
        @Override
        public CanchaDto findCanchaById(Long id) {
            log.warn("Fallback canchas activado. idCancha={}", id);
            return CanchaDto.builder()
                    .id(id)
                    .nombre("NO DISPONIBLE")
                    .ubicacion("NO DISPONIBLE")
                    .tipo("NO DISPONIBLE")
                    .activa(false)
                    .build();
        }
    }
}

