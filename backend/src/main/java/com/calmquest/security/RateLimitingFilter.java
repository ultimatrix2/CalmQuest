package com.calmquest.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A simple in-memory rate limiter for authentication endpoints.
 * Limits to a very strict bucket per IP address (e.g., 10 attempts per minute).
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long TIME_WINDOW_MS = 60000;

    private final ConcurrentHashMap<String, RequestInfo> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only rate limit /api/auth/** endpoints (login, signup, forgot-password, reset-password, verify-otp)
        if (path.startsWith("/api/auth/")) {
            String clientIp = getClientIp(request);
            
            if (isRateLimited(clientIp)) {
                log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please wait a minute and try again.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        
        RequestInfo info = requestCounts.compute(ip, (key, currentInfo) -> {
            if (currentInfo == null || (now - currentInfo.windowStart) > TIME_WINDOW_MS) {
                return new RequestInfo(now, 1);
            }
            currentInfo.count++;
            return currentInfo;
        });

        return info.count > MAX_REQUESTS_PER_MINUTE;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private static class RequestInfo {
        long windowStart;
        int count;

        RequestInfo(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
