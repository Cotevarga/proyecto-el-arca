package com.elarca.infrastructure.persistence.repository;

import com.elarca.infrastructure.persistence.entity.RecuerdoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaRecuerdoRepository extends JpaRepository<RecuerdoEntity, Long> {
    List<RecuerdoEntity> findAllByOrderByCreatedAtDesc();
    List<RecuerdoEntity> findByAprobadoTrueOrderByCreatedAtDesc();
    List<RecuerdoEntity> findByAprobadoTrueAndTipoArchivoInOrderByCreatedAtDesc(List<String> mimeTypes);
    long countByAprobadoFalse();
}
