package com.jobportal.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// In-memory, per-IP, per-endpoint. Toggle with rate-limit.enabled in
// application.properties — set to false while testing to bypass entirely.
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    private static final Map<String, Bandwidth> LIMITS = new LinkedHashMap<>();
    static {
        LIMITS.put("/otp/", Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))));
        LIMITS.put("/password-reset/", Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))));
        LIMITS.put("/auth/login", Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1))));
        LIMITS.put("/users/register", Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))));
        LIMITS.put("/resume/generate", Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1))));
        LIMITS.put("/jobs/post", Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))));
        LIMITS.put("/jobs/apply", Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1))));
        LIMITS.put("/chat/send", Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1))));
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String matchedPrefix = null;
        for (String prefix : LIMITS.keySet()) {
            if (path.startsWith(prefix)) {
                matchedPrefix = prefix;
                break;
            }
        }

        if (matchedPrefix == null) {
            chain.doFilter(request, response);
            return;
        }

        String ip = resolveClientIp(request);
        String bucketKey = matchedPrefix + "|" + ip;
        String limitKey = matchedPrefix;
        Bucket bucket = buckets.computeIfAbsent(bucketKey,
                k -> Bucket.builder().addLimit(LIMITS.get(limitKey)).build());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests, please try again later\"}");
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
