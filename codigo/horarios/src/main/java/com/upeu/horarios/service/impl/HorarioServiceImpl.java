package com.upeu.horarios.service.impl;

import com.upeu.horarios.dto.HorarioRequest;
import com.upeu.horarios.dto.HorarioResponse;
import com.upeu.horarios.entity.Horario;
import com.upeu.horarios.exception.ResourceNotFoundException;
import com.upeu.horarios.mapper.HorarioMapper;
import com.upeu.horarios.repository.HorarioRepository;
import com.upeu.horarios.service.HorarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HorarioServiceImpl implements HorarioService {
    private final HorarioRepository repository;
    private final HorarioMapper mapper;

    @Override
    @Transactional
    public HorarioResponse create(HorarioRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HorarioResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HorarioResponse findById(Long id) {
        Horario entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horario con id " + id + " no encontrado"));
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    public HorarioResponse update(Long id, HorarioRequest request) {
        Horario entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horario con id " + id + " no encontrado"));
        mapper.updateEntityFromRequest(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Horario con id " + id + " no encontrado");
        }
        repository.deleteById(id);
    }
}

