package com.upeu.reservas.service.impl;

import com.upeu.reservas.client.CanchasClient;
import com.upeu.reservas.client.HorariosClient;
import com.upeu.reservas.dto.CanchaDto;
import com.upeu.reservas.dto.HorarioDto;
import com.upeu.reservas.dto.ReservaRequest;
import com.upeu.reservas.dto.ReservaResponse;
import com.upeu.reservas.entity.Reserva;
import com.upeu.reservas.exception.ResourceNotFoundException;
import com.upeu.reservas.mapper.ReservaMapper;
import com.upeu.reservas.repository.ReservaRepository;
import com.upeu.reservas.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements ReservaService {
    private final ReservaRepository repository;
    private final ReservaMapper mapper;
    private final CanchasClient canchasClient;
    private final HorariosClient horariosClient;

    @Override
    @Transactional
    public ReservaResponse create(ReservaRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
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
    public ReservaResponse findDetalleById(Long id) {
        Reserva reserva = getById(id);
        CanchaDto cancha = canchasClient.findCanchaById(reserva.getIdCancha());
        HorarioDto horario = horariosClient.findHorarioById(reserva.getIdHorario());

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

    private Reserva getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva con id " + id + " no encontrada"));
    }
}

