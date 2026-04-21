package com.upeu.horarios.service;

import com.upeu.horarios.dto.HorarioRequest;
import com.upeu.horarios.dto.HorarioResponse;

import java.util.List;

public interface HorarioService {
    HorarioResponse create(HorarioRequest request);
    List<HorarioResponse> findAll();
    HorarioResponse findById(Long id);
    HorarioResponse update(Long id, HorarioRequest request);
    void delete(Long id);
}

