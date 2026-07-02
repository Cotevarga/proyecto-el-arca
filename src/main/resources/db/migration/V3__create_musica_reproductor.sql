CREATE TABLE IF NOT EXISTS musica_reproductor (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    artista VARCHAR(255),
    url_mp3 VARCHAR(1024),
    storage_path VARCHAR(512),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_musica_activo ON musica_reproductor(activo);
CREATE INDEX idx_musica_orden ON musica_reproductor(orden);
