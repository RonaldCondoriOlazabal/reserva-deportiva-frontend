package com.upeu.auth.service;

import com.upeu.auth.dto.UsuarioRequest;
import com.upeu.auth.dto.UsuarioResponse;

import java.util.List;

public interface UsuarioService {
    UsuarioResponse create(UsuarioRequest request);
    List<UsuarioResponse> findAll();
    UsuarioResponse findById(Long id);
    UsuarioResponse update(Long id, UsuarioRequest request);
    void delete(Long id);
}

