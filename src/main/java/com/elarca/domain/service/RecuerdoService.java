package com.elarca.domain.service;

import com.elarca.domain.model.Recuerdo;
import java.util.List;

public interface RecuerdoService {
    List<Recuerdo> findAll();
    List<Recuerdo> findApproved();
    Recuerdo approve(Long id, String seccion);
    void delete(Long id);
    Recuerdo upload(String nombre, String anio, String mensaje, String contentType, byte[] data, String originalFilename, long size);
    Recuerdo uploadAsAdmin(String texto, String seccion, String contentType, byte[] data, String originalFilename, long size);
}
