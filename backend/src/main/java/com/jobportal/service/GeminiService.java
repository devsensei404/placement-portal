package com.jobportal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.AtsScoreDTO;
import com.jobportal.dto.CandidateRankDTO;
import com.jobportal.dto.JobRecommendationDTO;
import com.jobportal.dto.ResumeRequestDTO;
import com.jobportal.dto.ResumeResponseDTO;
import com.jobportal.entity.*;
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

    // Used for resume generation AND the ATS score check — both are one-shot, low
    // frequency, single-resume calls, so sharing this key's quota is fine.
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // Separate Google AI Studio project/key — dedicated to job recommendations (1 image
    // per call) and candidate ranking (text-only, but can be batched frequently by
    // recruiters), kept isolated so heavy usage here never starves resume-gen/ATS.
    @Value("${gemini.api.key.ranking}")
    private String geminiRankingApiKey;

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
  "location": "city, state/country or empty string",
  "linkedin": "linkedin url or empty string",
  "github": "github url or empty string",
  "portfolio": "portfolio/personal website url or empty string",
  "summary": "2-3 line professional summary",
  "education": [
    { "degree": "...", "institution": "...", "year": "...", "grade": "..." }
  ],
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "...", "company": "...", "duration": "...", "location": "...", "points": ["..."] }
  ],
  "projects": [
    { "name": "...", "tech": "...", "points": ["..."] }
  ],
  "certifications": [
    { "name": "...", "issuer": "...", "date": "...", "credentialId": "...", "credentialUrl": "..." }
  ],
  "achievements": ["achievement 1"]
}

Do not add any explanation or text outside the JSON object.
""";

    private static final String ATS_SYSTEM_PROMPT = """
You are an ATS (Applicant Tracking System) resume auditor.

You will be given a resume image. Evaluate it purely on what is visible in the image —
never invent details that aren't shown.

Score across these dimensions (each 0-100):
- formattingScore: how ATS-parseable the layout is (no tables/columns/graphics that
  break parsing, clear section headers, standard fonts)
- keywordScore: presence of concrete skills, technologies, and role-relevant keywords
- clarityScore: use of action verbs, quantifiable achievements, concise bullet points

The overall "score" should be a holistic 0-100 combining all of the above.

Return ONLY a valid JSON object — no markdown, no backticks, no preamble — exactly in
this structure:

{
  "score": 72,
  "formattingScore": 80,
  "keywordScore": 65,
  "clarityScore": 70,
  "strengths": ["short strength 1", "short strength 2"],
  "missingElements": ["short missing element 1"],
  "suggestions": ["short actionable suggestion 1", "short actionable suggestion 2"],
  "summary": "one or two line overall verdict"
}

Do not add any explanation or text outside the JSON object.
""";

    // NOTE: candidate ranking is intentionally TEXT-ONLY (profile + application data),
    // not resume images — a job can have many applicants, and sending N resume images
    // per recruiter page-load would burn through the ranking key's quota fast. Text is
    // far cheaper per call and scales to batching many candidates at once.
    private static final String RANKING_SYSTEM_PROMPT = """
You are an expert technical recruiter screening candidates for a specific job, using
only the structured profile and application data provided (no resume file/image).

You will be given the job's requirements, followed by one or more candidates, each
labeled "Candidate <index>: applicantId=<id>" with their profile summary, skills, work
experience, certifications, and the cover letter they submitted for this job.

For EACH candidate, evaluate fit against the job requirements and return a score.
Score every candidate against the SAME fixed job requirements — do not rank candidates
relative to each other, and do not let a candidate's position in the list affect their
score. Two candidates with identical qualifications must receive identical scores,
regardless of which batch they appear in.

Scoring guide:
- 90-100: Excellent match — meets nearly all requirements, strong relevant experience
- 70-89: Good match — meets most requirements, minor gaps
- 40-69: Partial match — meets some requirements, notable gaps
- 0-39: Weak match — missing most key requirements

Be honest and critical — do not inflate scores. Base the score ONLY on the data
provided; never invent skills or experience that aren't shown.

Return ONLY a valid JSON array — no markdown, no backticks, no preamble — one object
per candidate, in this exact structure:

[
  {
    "applicantId": 123,
    "score": 82,
    "strengths": ["short strength 1", "short strength 2"],
    "gaps": ["short gap 1"],
    "summary": "one or two line overall verdict"
  }
]

Do not add any explanation or text outside the JSON array.
""";

    private static final String RECOMMENDATION_SYSTEM_PROMPT = """
You are a career advisor matching a student/candidate to open job listings.

You will be given the candidate's resume image (if provided) and a list of open jobs,
each labeled "Job <index>: jobId=<id>" with title, skills required, experience level,
location and description.

For EACH job, score how well it fits the candidate's background, skills and experience
level. Be honest — do not inflate scores for jobs that are a poor fit.

Scoring guide:
- 90-100: Excellent fit — skills and experience align closely
- 70-89: Good fit — aligns well with minor gaps
- 40-69: Partial fit — some relevant overlap
- 0-39: Weak fit — little relevant overlap

Return ONLY a valid JSON array — no markdown, no backticks, no preamble — one object
per job, in this exact structure:

[
  {
    "jobId": 456,
    "score": 78,
    "reason": "one line explaining why this job fits (or doesn't)"
  }
]

Do not add any explanation or text outside the JSON array.
""";

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public ResumeResponseDTO.ResumeData generateResume(ResumeRequestDTO request) throws JobPortalException {
        String prompt = buildTextPrompt(request);
        String imageBase64 = fetchImageBase64(request.getResumeImageUrl());
        List<String> images = imageBase64 != null ? List.of(imageBase64) : List.of();

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String rawJson = callGemini(prompt, images, geminiApiKey);
                return parseResumeJson(rawJson);
            } catch (Exception e) {
                e.printStackTrace();
                if (attempt == 2) {
                    throw new JobPortalException("AI generation failed. Please try again.");
                }
            }
        }
        throw new JobPortalException("AI generation failed. Please try again.");
    }

    /**
     * Scores a single resume image on ATS-friendliness. Uses the resume-generation key —
     * this is a one-shot, single-image call, low enough volume to share that quota.
     */
    public AtsScoreDTO scoreResume(String resumeImageUrl) throws JobPortalException {
        String imageBase64 = fetchImageBase64(resumeImageUrl);
        if (imageBase64 == null) {
            throw new JobPortalException("RESUME_NOT_FOUND");
        }
        return scoreResumeBase64(imageBase64);
    }

    /**
     * Same as scoreResume(url), but for a directly-uploaded file that was never saved
     * anywhere (e.g. the standalone "try before you save" ATS checker) — bytes are
     * base64-encoded in memory and sent straight to Gemini, nothing is persisted.
     */
    public AtsScoreDTO scoreResumeBytes(byte[] resumeBytes) throws JobPortalException {
        if (resumeBytes == null || resumeBytes.length == 0) {
            throw new JobPortalException("RESUME_NOT_FOUND");
        }
        return scoreResumeBase64(Base64.getEncoder().encodeToString(resumeBytes));
    }

    private AtsScoreDTO scoreResumeBase64(String imageBase64) throws JobPortalException {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String rawJson = callGemini(ATS_SYSTEM_PROMPT, List.of(imageBase64), geminiApiKey);
                return objectMapper.readValue(stripFences(rawJson), AtsScoreDTO.class);
            } catch (Exception e) {
                e.printStackTrace();
                if (attempt == 2) {
                    throw new JobPortalException("AI scoring failed. Please try again.");
                }
            }
        }
        throw new JobPortalException("AI scoring failed. Please try again.");
    }

    /**
     * Ranks a batch of applicants against a job's requirements using TEXT ONLY — profile
     * skills/experience/certifications plus their application cover letter. No resume
     * images are sent, keeping this cheap enough to batch many candidates per call.
     * Callers should chunk very large applicant lists (e.g. 40+ per call).
     */
    public List<CandidateRankDTO> rankApplicants(Job job, List<Applicant> applicants, Map<Long, Profile> profilesByApplicantId) throws JobPortalException {
        if (applicants == null || applicants.isEmpty()) return List.of();

        StringBuilder prompt = new StringBuilder();
        prompt.append(RANKING_SYSTEM_PROMPT);
        prompt.append("\n\n--- JOB REQUIREMENTS ---\n");
        prompt.append("Title: ").append(orEmpty(job.getJobTitle())).append("\n");
        prompt.append("Experience level: ").append(orEmpty(job.getExperience())).append("\n");
        if (job.getSkillsRequired() != null && !job.getSkillsRequired().isEmpty()) {
            prompt.append("Skills required: ").append(String.join(", ", job.getSkillsRequired())).append("\n");
        }
        prompt.append("Description: ").append(orEmpty(job.getDescription())).append("\n");

        int index = 1;
        for (Applicant applicant : applicants) {
            prompt.append("\n--- Candidate ").append(index).append(": applicantId=")
                    .append(applicant.getApplicantId()).append(" ---\n");

            Profile profile = profilesByApplicantId.get(applicant.getApplicantId());
            if (profile != null) {
                prompt.append("Current/target role: ").append(orEmpty(profile.getJobTitle())).append("\n");
                if (profile.getAbout() != null && !profile.getAbout().isBlank()) {
                    prompt.append("About: ").append(profile.getAbout()).append("\n");
                }
                if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
                    prompt.append("Skills: ").append(String.join(", ", profile.getSkills())).append("\n");
                }
                if (profile.getExperience() != null && !profile.getExperience().isEmpty()) {
                    prompt.append("Experience:\n");
                    for (Experience exp : profile.getExperience()) {
                        prompt.append("  - ").append(orEmpty(exp.getTitle())).append(" at ")
                                .append(orEmpty(exp.getCompany()));
                        if (exp.getDescription() != null && !exp.getDescription().isBlank()) {
                            prompt.append(": ").append(exp.getDescription());
                        }
                        prompt.append("\n");
                    }
                }
                if (profile.getCertifications() != null && !profile.getCertifications().isEmpty()) {
                    prompt.append("Certifications: ");
                    List<String> certNames = new ArrayList<>();
                    for (Certification cert : profile.getCertifications()) {
                        certNames.add(orEmpty(cert.getName()) + (cert.getIssuer() != null ? " (" + cert.getIssuer() + ")" : ""));
                    }
                    prompt.append(String.join(", ", certNames)).append("\n");
                }
            } else {
                prompt.append("(No profile data available for this candidate.)\n");
            }

            if (applicant.getCoverLetter() != null && !applicant.getCoverLetter().isBlank()) {
                prompt.append("Cover letter for this application: ").append(applicant.getCoverLetter()).append("\n");
            }

            index++;
        }

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String rawJson = callGemini(prompt.toString(), List.of(), geminiRankingApiKey);
                return parseJsonList(rawJson, CandidateRankDTO.class);
            } catch (Exception e) {
                e.printStackTrace();
                if (attempt == 2) {
                    throw new JobPortalException("AI ranking failed. Please try again.");
                }
            }
        }
        throw new JobPortalException("AI ranking failed. Please try again.");
    }

    /**
     * Scores a list of open jobs against a candidate's resume image (falls back to
     * profile skills as text if no resume image exists). Only ever sends ONE image per
     * call regardless of how many jobs are being compared.
     */
    public List<JobRecommendationDTO> recommendJobs(Profile profile, List<Job> openJobs) throws JobPortalException {
        if (openJobs == null || openJobs.isEmpty()) return List.of();

        StringBuilder prompt = new StringBuilder();
        prompt.append(RECOMMENDATION_SYSTEM_PROMPT);
        prompt.append("\n\n--- OPEN JOBS ---\n");

        int index = 1;
        for (Job job : openJobs) {
            prompt.append("\nJob ").append(index).append(": jobId=").append(job.getId()).append("\n");
            prompt.append("  Title: ").append(orEmpty(job.getJobTitle())).append("\n");
            prompt.append("  Experience level: ").append(orEmpty(job.getExperience())).append("\n");
            prompt.append("  Location: ").append(orEmpty(job.getLocation())).append("\n");
            if (job.getSkillsRequired() != null && !job.getSkillsRequired().isEmpty()) {
                prompt.append("  Skills required: ").append(String.join(", ", job.getSkillsRequired())).append("\n");
            }
            prompt.append("  Description: ").append(orEmpty(job.getDescription())).append("\n");
            index++;
        }

        String resumeImage = fetchImageBase64(profile.getResumeUrl());
        List<String> images = resumeImage != null ? List.of(resumeImage) : List.of();

        if (resumeImage == null) {
            prompt.append("\n(No resume image available — base scoring on the candidate's profile skills below.)\n");
            if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
                prompt.append("Candidate skills: ").append(String.join(", ", profile.getSkills())).append("\n");
            }
        }

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String rawJson = callGemini(prompt.toString(), images, geminiRankingApiKey);
                return parseJsonList(rawJson, JobRecommendationDTO.class);
            } catch (Exception e) {
                e.printStackTrace();
                if (attempt == 2) {
                    throw new JobPortalException("AI job recommendation failed. Please try again.");
                }
            }
        }
        throw new JobPortalException("AI job recommendation failed. Please try again.");
    }

    // ── private helpers ──────────────────────────────────────────────────

    private String buildTextPrompt(ResumeRequestDTO req) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_PROMPT).append("\n\n--- CANDIDATE DATA ---\n");
        sb.append("Name: ").append(orEmpty(req.getName())).append("\n");
        sb.append("Email: ").append(orEmpty(req.getEmail())).append("\n");
        sb.append("Phone: ").append(orEmpty(req.getPhone())).append("\n");
        sb.append("Location: ").append(orEmpty(req.getLocation())).append("\n");
        sb.append("LinkedIn: ").append(orEmpty(req.getLinkedin())).append("\n");
        sb.append("GitHub: ").append(orEmpty(req.getGithub())).append("\n");
        sb.append("Portfolio: ").append(orEmpty(req.getPortfolio())).append("\n");

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
                        .append(" (").append(orEmpty(e.getDuration())).append(")");
                if (e.getLocation() != null && !e.getLocation().isBlank()) {
                    sb.append(" [").append(e.getLocation()).append("]");
                }
                sb.append("\n");
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

        if (req.getCertifications() != null && !req.getCertifications().isEmpty()) {
            sb.append("\nCertifications:\n");
            req.getCertifications().forEach(c -> {
                sb.append("  - ").append(c.getName()).append(" | ").append(orEmpty(c.getIssuer()))
                        .append(" | ").append(orEmpty(c.getDate()));
                if (c.getCredentialId() != null && !c.getCredentialId().isBlank()) {
                    sb.append(" | ID: ").append(c.getCredentialId());
                }
                if (c.getCredentialUrl() != null && !c.getCredentialUrl().isBlank()) {
                    sb.append(" | URL: ").append(c.getCredentialUrl());
                }
                sb.append("\n");
            });
        }

        if (req.getAchievements() != null && !req.getAchievements().isEmpty()) {
            sb.append("\nAchievements:\n");
            req.getAchievements().forEach(a -> sb.append("  - ").append(a).append("\n"));
        }

        return sb.toString();
    }

    /**
     * Calls Gemini with a text prompt plus zero or more inline images, using the given API key.
     */
    @SuppressWarnings("unchecked")
    private String callGemini(String prompt, List<String> imagesBase64, String apiKey) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        if (imagesBase64 != null) {
            for (String imageBase64 : imagesBase64) {
                if (imageBase64 == null) continue;
                parts.add(Map.of(
                        "inline_data", Map.of(
                                "mime_type", "image/jpeg",
                                "data", imageBase64
                        )
                ));
            }
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 8192
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                GEMINI_URL + apiKey, entity, Map.class
        );

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
        return (String) responseParts.get(0).get("text");
    }

    private ResumeResponseDTO.ResumeData parseResumeJson(String raw) throws Exception {
        return objectMapper.readValue(stripFences(raw), ResumeResponseDTO.ResumeData.class);
    }

    private <T> List<T> parseJsonList(String raw, Class<T> elementType) throws Exception {
        String clean = stripFences(raw);
        return objectMapper.readValue(clean,
                objectMapper.getTypeFactory().constructCollectionType(List.class, elementType));
    }

    private String stripFences(String raw) {
        return raw.trim()
                .replaceAll("(?s)^```json\\s*", "")
                .replaceAll("(?s)^```\\s*", "")
                .replaceAll("(?s)```\\s*$", "")
                .trim();
    }

    private String fetchImageBase64(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        try {
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            connection.setConnectTimeout(6000);
            connection.setReadTimeout(6000);

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
