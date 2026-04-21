package com.upeu.canchas.controller;

import com.upeu.canchas.dto.CanchaRequest;
import com.upeu.canchas.dto.CanchaResponse;
import com.upeu.canchas.service.CanchaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/canchas")
@RequiredArgsConstructor
public class CanchaController {

    private final CanchaService canchaService;

    @PostMapping
    public ResponseEntity<CanchaResponse> create(@Valid @RequestBody CanchaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(canchaService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CanchaResponse>> findAll() {
        return ResponseEntity.ok(canchaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CanchaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(canchaService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CanchaResponse> update(@PathVariable Long id, @Valid @RequestBody CanchaRequest request) {
        return ResponseEntity.ok(canchaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        canchaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

