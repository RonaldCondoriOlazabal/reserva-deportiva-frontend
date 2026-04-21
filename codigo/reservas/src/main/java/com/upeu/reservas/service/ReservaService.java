package com.upeu.reservas.service;

import com.upeu.reservas.dto.ReservaRequest;
import com.upeu.reservas.dto.ReservaResponse;

import java.util.List;

public interface ReservaService {
    ReservaResponse create(ReservaRequest request);
    List<ReservaResponse> findAll();
    ReservaResponse findById(Long id);
    ReservaResponse update(Long id, ReservaRequest request);
    void delete(Long id);
    ReservaResponse findDetalleById(Long id);
}

