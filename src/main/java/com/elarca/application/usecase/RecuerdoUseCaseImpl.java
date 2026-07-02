package com.elarca.application.usecase;

import com.elarca.application.dto.RecuerdoDTO;
import com.elarca.application.mapper.RecuerdoMapper;
import com.elarca.domain.service.RecuerdoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecuerdoUseCaseImpl implements RecuerdoUseCase {

    private final RecuerdoService recuerdoService;
    private final RecuerdoMapper recuerdoMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RecuerdoDTO> getAll() {
        return recuerdoService.findAll().stream()
            .map(recuerdoMapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecuerdoDTO> getApproved() {
        return recuerdoService.findApproved().stream()
            .map(recuerdoMapper::toDto)
            .toList();
    }

    @Override
    @Transactional
    public RecuerdoDTO approve(Long id, String seccion) {
        return recuerdoMapper.toDto(recuerdoService.approve(id, seccion));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        recuerdoService.delete(id);
    }

    @Override
    @Transactional
    public RecuerdoDTO upload(String nombre, String anio, String mensaje,
                               String contentType, byte[] data,
                               String originalFilename, long size) {
        return recuerdoMapper.toDto(
            recuerdoService.upload(nombre, anio, mensaje, contentType, data, originalFilename, size));
    }

    @Override
    @Transactional
    public RecuerdoDTO uploadAsAdmin(String texto, String seccion,
                                      String contentType, byte[] data,
                                      String originalFilename, long size) {
        return recuerdoMapper.toDto(
            recuerdoService.uploadAsAdmin(texto, seccion, contentType, data, originalFilename, size));
    }
}
