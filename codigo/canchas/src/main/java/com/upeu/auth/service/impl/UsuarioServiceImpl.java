package com.upeu.auth.service.impl;

import com.upeu.auth.dto.UsuarioRequest;
import com.upeu.auth.dto.UsuarioResponse;
import com.upeu.auth.entity.Usuario;
import com.upeu.auth.exception.ResourceNotFoundException;
import com.upeu.auth.mapper.UsuarioMapper;
import com.upeu.auth.repository.UsuarioRepository;
import com.upeu.auth.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {
    private final UsuarioRepository repository;
    private final UsuarioMapper mapper;

    @Override
    @Transactional
    public UsuarioResponse create(UsuarioRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse findById(Long id) {
        Usuario entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario con id " + id + " no encontrado"));
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    public UsuarioResponse update(Long id, UsuarioRequest request) {
        Usuario entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario con id " + id + " no encontrado"));
        mapper.updateEntityFromRequest(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario con id " + id + " no encontrado");
        }
        repository.deleteById(id);
    }
}

