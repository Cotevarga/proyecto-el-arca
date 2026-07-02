package com.elarca.infrastructure.persistence.repository;

import com.elarca.infrastructure.persistence.entity.MusicaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaMusicaRepository extends JpaRepository<MusicaEntity, Long> {
    List<MusicaEntity> findAllByOrderByOrdenAsc();
    List<MusicaEntity> findByActivoTrueOrderByOrdenAsc();
}
