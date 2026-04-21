package com.upeu.canchas.service;

import com.upeu.canchas.dto.CanchaRequest;
import com.upeu.canchas.dto.CanchaResponse;

import java.util.List;

public interface CanchaService {
    CanchaResponse create(CanchaRequest request);
    List<CanchaResponse> findAll();
    CanchaResponse findById(Long id);
    CanchaResponse update(Long id, CanchaRequest request);
    void delete(Long id);
}

