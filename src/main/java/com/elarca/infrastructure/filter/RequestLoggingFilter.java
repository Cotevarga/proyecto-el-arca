package com.elarca.infrastructure.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
@Order(2)
public class RequestLoggingFilter implements Filter {

    private final ThreadLocal<Instant> startTime = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {
        startTime.set(Instant.now());
        try {
            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            HttpServletRequest request = (HttpServletRequest) servletRequest;
            HttpServletResponse response = (HttpServletResponse) servletResponse;
            Duration duration = Duration.between(startTime.get(), Instant.now());

            log.info("method={} path={} status={} duration={}ms clientIp={}",
                request.getMethod(), request.getRequestURI(),
                response.getStatus(), duration.toMillis(), getClientIp(request));

            startTime.remove();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri;
        return request.getRemoteAddr();
    }
}
