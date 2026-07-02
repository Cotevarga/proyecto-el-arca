package com.elarca.domain.repository;

import com.elarca.domain.model.Recuerdo;
import java.util.List;
import java.util.Optional;

public interface RecuerdoRepository {
    List<Recuerdo> findAllOrderByCreatedAtDesc();
    List<Recuerdo> findApprovedOrderByCreatedAtDesc();
    List<Recuerdo> findApprovedImages();
    Optional<Recuerdo> findById(Long id);
    Recuerdo save(Recuerdo recuerdo);
    void deleteById(Long id);
}
