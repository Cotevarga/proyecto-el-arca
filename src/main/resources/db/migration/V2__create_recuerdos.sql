CREATE TABLE IF NOT EXISTS recuerdos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    anio VARCHAR(255),
    mensaje TEXT,
    tipo_archivo VARCHAR(100),
    url_archivo VARCHAR(1024),
    storage_path VARCHAR(512),
    nombre_original VARCHAR(255),
    tamanio_bytes BIGINT,
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    seccion VARCHAR(100),
    texto TEXT,
    tipo VARCHAR(50),
    url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recuerdos_aprobado ON recuerdos(aprobado);
CREATE INDEX idx_recuerdos_seccion ON recuerdos(seccion);
CREATE INDEX idx_recuerdos_created_at ON recuerdos(created_at DESC);
