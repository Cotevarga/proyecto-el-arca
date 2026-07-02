package com.elarca.domain.repository;

import com.elarca.domain.model.Musica;
import java.util.List;
import java.util.Optional;

public interface MusicaRepository {
    List<Musica> findAllOrderByOrdenAsc();
    List<Musica> findActiveOrderByOrdenAsc();
    Optional<Musica> findById(Long id);
    Musica save(Musica musica);
    void deleteById(Long id);
}
