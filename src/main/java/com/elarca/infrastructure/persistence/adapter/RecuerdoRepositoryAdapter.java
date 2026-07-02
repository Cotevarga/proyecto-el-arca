package com.elarca.infrastructure.persistence.adapter;

import com.elarca.domain.model.Recuerdo;
import com.elarca.domain.repository.RecuerdoRepository;
import com.elarca.infrastructure.persistence.entity.RecuerdoEntity;
import com.elarca.infrastructure.persistence.mapper.RecuerdoEntityMapper;
import com.elarca.infrastructure.persistence.repository.JpaRecuerdoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RecuerdoRepositoryAdapter implements RecuerdoRepository {

    private final JpaRecuerdoRepository jpaRecuerdoRepository;
    private final RecuerdoEntityMapper mapper;

    @Override
    public List<Recuerdo> findAllOrderByCreatedAtDesc() {
        return jpaRecuerdoRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(mapper::toDomain).toList();
    }

    @Override
    public List<Recuerdo> findApprovedOrderByCreatedAtDesc() {
        return jpaRecuerdoRepository.findByAprobadoTrueOrderByCreatedAtDesc().stream()
            .map(mapper::toDomain).toList();
    }

    @Override
    public List<Recuerdo> findApprovedImages() {
        return jpaRecuerdoRepository
            .findByAprobadoTrueAndTipoArchivoInOrderByCreatedAtDesc(
                List.of("image/jpeg", "image/png", "image/webp", "image/gif"))
            .stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Recuerdo> findById(Long id) {
        return jpaRecuerdoRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Recuerdo save(Recuerdo recuerdo) {
        RecuerdoEntity entity = mapper.toEntity(recuerdo);
        if (entity.getId() == null) {
            entity.setId(null);
        }
        RecuerdoEntity saved = jpaRecuerdoRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        jpaRecuerdoRepository.deleteById(id);
    }
}
