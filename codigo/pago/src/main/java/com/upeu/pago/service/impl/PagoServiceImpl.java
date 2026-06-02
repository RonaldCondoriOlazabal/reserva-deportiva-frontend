package com.upeu.pago.service.impl;

import com.upeu.pago.dto.PagoRequest;
import com.upeu.pago.dto.PagoResponse;
import com.upeu.pago.entity.Pago;
import com.upeu.pago.exception.ResourceNotFoundException;
import com.upeu.pago.mapper.PagoMapper;
import com.upeu.pago.repository.PagoRepository;
import com.upeu.pago.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoServiceImpl implements PagoService {
    private final PagoRepository repository;
    private final PagoMapper mapper;

    @Override
    @Transactional
    public PagoResponse create(PagoRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagoResponse findById(Long id) {
        return mapper.toResponse(getById(id));
    }

    @Override
    @Transactional
    public PagoResponse update(Long id, PagoRequest request) {
        Pago entity = getById(id);
        mapper.updateEntityFromRequest(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Pago con id " + id + " no encontrado");
        }
        repository.deleteById(id);
    }

    private Pago getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago con id " + id + " no encontrado"));
    }
}
