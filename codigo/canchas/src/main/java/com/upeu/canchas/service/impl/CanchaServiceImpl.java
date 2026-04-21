package com.upeu.canchas.service.impl;

import com.upeu.canchas.dto.CanchaRequest;
import com.upeu.canchas.dto.CanchaResponse;
import com.upeu.canchas.entity.Cancha;
import com.upeu.canchas.exception.ResourceNotFoundException;
import com.upeu.canchas.mapper.CanchaMapper;
import com.upeu.canchas.repository.CanchaRepository;
import com.upeu.canchas.service.CanchaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CanchaServiceImpl implements CanchaService {

    private final CanchaRepository canchaRepository;
    private final CanchaMapper canchaMapper;

    @Override
    @Transactional
    public CanchaResponse create(CanchaRequest request) {
        log.info("Creando cancha nombre={}", request.getNombre());
        Cancha entity = canchaMapper.toEntity(request);
        Cancha saved = canchaRepository.save(entity);
        return canchaMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CanchaResponse> findAll() {
        return canchaRepository.findAll().stream().map(canchaMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CanchaResponse findById(Long id) {
        Cancha entity = canchaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cancha con id " + id + " no encontrada"));
        return canchaMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public CanchaResponse update(Long id, CanchaRequest request) {
        Cancha entity = canchaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cancha con id " + id + " no encontrada"));
        canchaMapper.updateEntityFromRequest(entity, request);
        Cancha saved = canchaRepository.save(entity);
        return canchaMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!canchaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cancha con id " + id + " no encontrada");
        }
        canchaRepository.deleteById(id);
    }
}

