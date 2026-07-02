package com.elarca.infrastructure.persistence.adapter;

import com.elarca.domain.model.Musica;
import com.elarca.domain.repository.MusicaRepository;
import com.elarca.infrastructure.persistence.entity.MusicaEntity;
import com.elarca.infrastructure.persistence.mapper.MusicaEntityMapper;
import com.elarca.infrastructure.persistence.repository.JpaMusicaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MusicaRepositoryAdapter implements MusicaRepository {

    private final JpaMusicaRepository jpaMusicaRepository;
    private final MusicaEntityMapper mapper;

    @Override
    public List<Musica> findAllOrderByOrdenAsc() {
        return jpaMusicaRepository.findAllByOrderByOrdenAsc().stream()
            .map(mapper::toDomain).toList();
    }

    @Override
    public List<Musica> findActiveOrderByOrdenAsc() {
        return jpaMusicaRepository.findByActivoTrueOrderByOrdenAsc().stream()
            .map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Musica> findById(Long id) {
        return jpaMusicaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Musica save(Musica musica) {
        MusicaEntity entity = mapper.toEntity(musica);
        if (entity.getId() == null) entity.setId(null);
        MusicaEntity saved = jpaMusicaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        jpaMusicaRepository.deleteById(id);
    }
}
