package com.elarca.infrastructure.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    String timestamp,
    int status,
    String message
) {
    public ErrorResponse(int status, String message) {
        this(Instant.now().toString(), status, message);
    }
}
