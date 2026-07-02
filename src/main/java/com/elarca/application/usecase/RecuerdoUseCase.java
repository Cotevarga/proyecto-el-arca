package com.elarca.application.usecase;

import com.elarca.application.dto.RecuerdoDTO;
import java.util.List;

public interface RecuerdoUseCase {
    List<RecuerdoDTO> getAll();
    List<RecuerdoDTO> getApproved();
    RecuerdoDTO approve(Long id, String seccion);
    void delete(Long id);
    RecuerdoDTO upload(String nombre, String anio, String mensaje, String contentType, byte[] data, String originalFilename, long size);
    RecuerdoDTO uploadAsAdmin(String texto, String seccion, String contentType, byte[] data, String originalFilename, long size);
}
