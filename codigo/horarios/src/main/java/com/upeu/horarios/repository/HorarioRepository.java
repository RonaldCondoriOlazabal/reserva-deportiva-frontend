package com.upeu.horarios.repository;

import com.upeu.horarios.entity.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
}

