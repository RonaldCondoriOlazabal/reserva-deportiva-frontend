package com.upeu.reservas.service.impl;

import com.upeu.reservas.client.CanchasClient;
import com.upeu.reservas.client.HorariosClient;
import com.upeu.reservas.dto.CanchaDto;
import com.upeu.reservas.dto.HorarioDto;
import com.upeu.reservas.dto.ReservaRequest;
import com.upeu.reservas.dto.ReservaResponse;
import com.upeu.reservas.entity.Reserva;
import com.upeu.reservas.evento.EventoReserva;
import com.upeu.reservas.exception.ResourceNotFoundException;
import com.upeu.reservas.mapper.ReservaMapper;
import com.upeu.reservas.repository.ReservaRepository;
import com.upeu.reservas.service.ReservaProducer;
import com.upeu.reservas.service.ReservaService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReservaServiceImpl implements ReservaService {

    private static final String TIPO_RESERVA_CREADA = "reserva.creada";
    private static final BigDecimal MONTO_RESERVA = new BigDecimal("50.00");

    private final ReservaRepository repository;
    private final ReservaMapper mapper;
    private final CanchasClient canchasClient;
    private final HorariosClient horariosClient;
    private final ReservaProducer reservaProducer;

    @Value("${spring.application.name}")
    private String applicationName;

    @Override
    @Transactional
    public ReservaResponse create(ReservaRequest request) {
        Reserva reservaGuardada = repository.save(mapper.toEntity(request));

        EventoReserva evento = EventoReserva.builder()
                .tipoEvento(TIPO_RESERVA_CREADA)
                .reservaId(reservaGuardada.getId())
                .idUsuario(reservaGuardada.getIdUsuario())
                .idCancha(reservaGuardada.getIdCancha())
                .idHorario(reservaGuardada.getIdHorario())
                .monto(MONTO_RESERVA)
                .estado(reservaGuardada.getEstado())
                .origen(applicationName)
                .timestamp(Instant.now().toEpochMilli())
                .build();

        reservaProducer.publicarReservaCreada(evento);

        return mapper.toResponse(reservaGuardada);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservaResponse findById(Long id) {
        Reserva entity = getById(id);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    public ReservaResponse update(Long id, ReservaRequest request) {
        Reserva entity = getById(id);
        mapper.updateEntityFromRequest(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Reserva con id " + id + " no encontrada");
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    @CircuitBreaker(name = "reservasDetalle", fallbackMethod = "fallbackDetalleReserva")
    public ReservaResponse findDetalleById(Long id) {
        log.info("Buscando detalle de reserva con ID: {}", id);
        Reserva reserva = getById(id);
        CanchaDto cancha;
        HorarioDto horario;

        try {
            cancha = canchasClient.findCanchaById(reserva.getIdCancha());
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Cancha con id " + reserva.getIdCancha() + " no encontrada");
        }

        try {
            horario = horariosClient.findHorarioById(reserva.getIdHorario());
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Horario con id " + reserva.getIdHorario() + " no encontrado");
        }

        return ReservaResponse.builder()
                .id(reserva.getId())
                .idUsuario(reserva.getIdUsuario())
                .idCancha(reserva.getIdCancha())
                .idHorario(reserva.getIdHorario())
                .fechaReserva(reserva.getFechaReserva())
                .estado(reserva.getEstado())
                .cancha(cancha)
                .horario(horario)
                .build();
    }

    public ReservaResponse fallbackDetalleReserva(Long id, Throwable ex) {
        if (ex instanceof ResourceNotFoundException resourceNotFoundException) {
            throw resourceNotFoundException;
        }
        log.warn("Fallback activado para reserva ID {}. Motivo: {}", id, ex.getMessage());
        Reserva reserva = getById(id);
        return ReservaResponse.builder()
                .id(reserva.getId())
                .idUsuario(reserva.getIdUsuario())
                .idCancha(reserva.getIdCancha())
                .idHorario(reserva.getIdHorario())
                .fechaReserva(reserva.getFechaReserva())
                .estado(reserva.getEstado())
                .cancha(null)
                .horario(null)
                .build();
    }

    private Reserva getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva con id " + id + " no encontrada"));
    }
}

