package com.jobportal;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    // This RestTemplate is shared by every service that makes outbound HTTP calls
    // (notably GeminiService for all AI features). Without explicit timeouts, a slow
    // or stalled response from an external API (e.g. Gemini) can hang the request
    // indefinitely instead of failing fast — which is what was causing
    // /jobs/recommendations to sit "pending" forever in the browser rather than
    // erroring out. 20s connect / 60s read gives Gemini enough time for a genuinely
    // large prompt (e.g. many jobs in one recommendation call) while still guaranteeing
    // the request eventually completes one way or the other.
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
    }

    // ObjectMapper bean lives in MyConfig — merged there to avoid duplicate bean conflict
}
