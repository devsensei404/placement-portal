package com.jobportal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.ResumeRequestDTO;
import com.jobportal.dto.ResumeResponseDTO;
import com.jobportal.exception.JobPortalException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private static final String SYSTEM_PROMPT = """
You are an expert resume writer and ATS optimization specialist.

You will be given:
1. A resume image (if provided) — extract all relevant information from it
2. Additional candidate details in structured form

Your job:
- Combine ALL information from both sources, preferring the form data if there is any conflict
- Remove duplicates
- Professionally rewrite all content — improve wording, fix grammar, make it concise and impactful
- Use strong action verbs for experience and projects
- Optimize for ATS systems — clean language, relevant keywords
- Avoid tables, emojis, and excessive formatting
- Keep summary under 70 words
- Each experience bullet should start with an action verb
- Prefer measurable achievements where provided
- Do not exceed one page worth of content when possible

CRITICAL — Do NOT fabricate or hallucinate:
- Never invent internships, projects, CGPA, skills, certifications, companies, or achievements
- If insufficient information exists for a section, return it as an empty array or empty string

Return ONLY a valid JSON object — no markdown, no backticks, no preamble — exactly in this structure:
The JSON must be syntactically valid.
Every property name must be enclosed in double quotes.
Do not include trailing commas.

{
  "name": "full name",
  "email": "email",
  "phone": "phone number",
  "website": "linkedin or portfolio url or empty string",
  "summary": "2-3 line professional summary",
  "education": [
    { "degree": "...", "institution": "...", "year": "...", "grade": "..." }
  ],
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "...", "company": "...", "duration": "...", "points": ["..."] }
  ],
  "projects": [
    { "name": "...", "tech": "...", "points": ["..."] }
  ],
  "achievements": ["achievement 1"]
}

Do not add any explanation or text outside the JSON object.
""";

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public ResumeResponseDTO.ResumeData generateResume(ResumeRequestDTO request) throws JobPortalException {
        String prompt = buildTextPrompt(request);
        String imageBase64 = fetchImageBase64(request.getResumeImageUrl());

        // Try once; on JSON parse failure, retry once
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String rawJson = callGemini(prompt, imageBase64);
                return parseResumeJson(rawJson);
            } catch (Exception e) {
                if (attempt == 2) {
                    throw new JobPortalException("AI generation failed. Please try again.");
                }
            }
        }
        throw new JobPortalException("AI generation failed. Please try again.");
    }

    // ── private helpers ──────────────────────────────────────────────────

    private String buildTextPrompt(ResumeRequestDTO req) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_PROMPT).append("\n\n--- CANDIDATE DATA ---\n");
        sb.append("Name: ").append(orEmpty(req.getName())).append("\n");
        sb.append("Email: ").append(orEmpty(req.getEmail())).append("\n");
        sb.append("Phone: ").append(orEmpty(req.getPhone())).append("\n");
        sb.append("Website: ").append(orEmpty(req.getWebsite())).append("\n");

        if (req.getEducation() != null && !req.getEducation().isEmpty()) {
            sb.append("\nEducation:\n");
            req.getEducation().forEach(e ->
                    sb.append("  - ").append(e.getDegree()).append(" | ").append(e.getInstitution())
                            .append(" | ").append(orEmpty(e.getYear())).append(" | ").append(orEmpty(e.getGrade())).append("\n")
            );
        }

        if (req.getSkills() != null && !req.getSkills().isEmpty()) {
            sb.append("\nSkills: ").append(String.join(", ", req.getSkills())).append("\n");
        }

        if (req.getExperience() != null && !req.getExperience().isEmpty()) {
            sb.append("\nExperience:\n");
            req.getExperience().forEach(e -> {
                sb.append("  - ").append(e.getTitle()).append(" at ").append(e.getCompany())
                        .append(" (").append(orEmpty(e.getDuration())).append(")\n");
                if (e.getPoints() != null) e.getPoints().forEach(p -> sb.append("      * ").append(p).append("\n"));
            });
        }

        if (req.getProjects() != null && !req.getProjects().isEmpty()) {
            sb.append("\nProjects:\n");
            req.getProjects().forEach(p -> {
                sb.append("  - ").append(p.getName()).append(" [").append(orEmpty(p.getTech())).append("]\n");
                if (p.getPoints() != null) p.getPoints().forEach(pt -> sb.append("      * ").append(pt).append("\n"));
            });
        }

        if (req.getAchievements() != null && !req.getAchievements().isEmpty()) {
            sb.append("\nAchievements:\n");
            req.getAchievements().forEach(a -> sb.append("  - ").append(a).append("\n"));
        }

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String callGemini(String prompt, String imageBase64) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build the parts list
        List<Map<String, Object>> parts = new ArrayList<>();

        // Add text part
        parts.add(Map.of("text", prompt));

        // Add image part only if we have one
        if (imageBase64 != null) {
            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", "image/jpeg",
                            "data", imageBase64
                    )
            ));
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 2048
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                GEMINI_URL + geminiApiKey, entity, Map.class
        );

        // Extract text from Gemini response structure:
        // response.candidates[0].content.parts[0].text
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
        return (String) responseParts.get(0).get("text");
    }

    private ResumeResponseDTO.ResumeData parseResumeJson(String raw) throws Exception {
        // Strip markdown fences if Gemini added them despite the instruction
        String clean = raw.trim()
                .replaceAll("(?s)^```json\\s*", "")
                .replaceAll("(?s)^```\\s*", "")
                .replaceAll("(?s)```\\s*$", "")
                .trim();
        return objectMapper.readValue(clean, ResumeResponseDTO.ResumeData.class);
    }

    private String fetchImageBase64(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        try {
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            connection.setConnectTimeout(5000); // 5 sec
            connection.setReadTimeout(5000);    // 5 sec

            try (InputStream inputStream = connection.getInputStream()) {
                byte[] bytes = inputStream.readAllBytes();
                return Base64.getEncoder().encodeToString(bytes);
            }

        } catch (Exception e) {
            return null;
        }
    }

    private String orEmpty(String s) {
        return s == null ? "" : s;
    }
}