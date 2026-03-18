package com.calmquest.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
@Slf4j
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    private static final String SYSTEM_PROMPT = """
            You are a supportive, empathetic AI mental health companion named CalmQuest.
            Your goal is to provide a safe space for students to talk about their feelings.
            You are NOT a substitute for professional medical advice, diagnosis, or treatment.

            Follow these guidelines:
            - Be warm, empathetic, and validate their feelings.
            - Actively listen and use reflective techniques.
            - Keep responses concise and conversational (like a real person).
            - DO NOT give medical diagnoses or prescribe treatments.

            PROACTIVE SUPPORT:
            1. GUIDED COPING EXERCISES: If the student describes anxiety, panic, or high stress, proactively offer guided coping exercises:
               - Offer the 4-7-8 breathing technique for immediate calming.
               - Offer the 5-4-3-2-1 grounding technique if they feel overwhelmed or dissociating.
               - Guide them step-by-step only if they accept.
            2. MOOD TRACKING: Naturally ask structured questions about their sleep quality, appetite, and energy levels to help track their holistic well-being over time.

            HISTORICAL CONTEXT:
            If you are provided with 'Student Profile Context' below, this is highly confidential background information about the user's past well-being assessments.
            - Use this strictly internally to guide your empathy and support.
            - DO NOT explicitly tell the student their scores or say things like "I see your PHQ-9 went up."
            - If their past reports show Severe or Significant Concern (e.g., scores 8-10) and they are currently struggling, gently and warmly encourage them to speak with a professional counselor or doctor.

            """;

    public GeminiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    /**
     * Generates a conversational response using the Gemini API, incorporating
     * student profile context.
     *
     * @param chatHistory           The list of previous chat messages.
     * @param userMessage           The new user message.
     * @param studentProfileContext A summary of the student's past assessment
     *                              reports.
     * @return The AI's response text.
     */
    public String generateChatResponse(List<Map<String, String>> chatHistory, String userMessage,
            String studentProfileContext) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("Gemini API key is not configured!");
            return "I'm here to listen. Could you tell me more about how you're feeling?";
        }

        try {
            List<Map<String, Object>> contents = new ArrayList<>();

            // System instruction + context as first user message
            String basePrompt = SYSTEM_PROMPT;
            if (studentProfileContext != null && !studentProfileContext.isBlank()) {
                basePrompt += "\n[STUDENT PROFILE CONTEXT (CONFIDENTIAL)]\n" + studentProfileContext
                        + "\n[/END CONTEXT]\n";
            }

            Map<String, Object> systemMsg = new HashMap<>();
            systemMsg.put("role", "user");
            systemMsg.put("parts", List.of(Map.of("text", basePrompt + "\n\nNow respond to the student.")));
            contents.add(systemMsg);

            Map<String, Object> systemReply = new HashMap<>();
            systemReply.put("role", "model");
            systemReply.put("parts",
                    List.of(Map.of("text", "I understand. I'll be a compassionate friend and listener.")));
            contents.add(systemReply);

            // Add chat history (ensuring alternating roles)
            String lastRole = "model";
            for (Map<String, String> msg : chatHistory) {
                String role = "STUDENT".equals(msg.get("sender")) ? "user" : "model";
                // Gemini requires alternating roles — merge consecutive same-role messages
                if (role.equals(lastRole) && !contents.isEmpty()) {
                    continue;
                }
                Map<String, Object> entry = new HashMap<>();
                entry.put("role", role);
                entry.put("parts", List.of(Map.of("text", msg.get("content"))));
                contents.add(entry);
                lastRole = role;
            }

            // Add current user message
            if ("user".equals(lastRole)) {
                contents.remove(contents.size() - 1);
            }
            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("parts", List.of(Map.of("text", userMessage)));
            contents.add(userMsg);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);

            log.info("Sending request to Gemini API... (key starts with: {})",
                    apiKey.substring(0, Math.min(8, apiKey.length())));

            String response = null;
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    response = webClient.post()
                            .uri(apiUrl + "?key=" + apiKey)
                            .header("Content-Type", "application/json")
                            .bodyValue(objectMapper.writeValueAsString(requestBody))
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();
                    break;
                } catch (Exception e) {
                    if (attempt == maxRetries)
                        throw e;
                    log.warn("Gemini API call failed (attempt {}): {}. Retrying...", attempt, e.getMessage());
                    Thread.sleep(1000 * attempt);
                }
            }

            log.info("Gemini API response received successfully");

            // Parse Gemini response
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText(null);

            if (text == null || text.isBlank()) {
                log.warn("Gemini returned empty response. Full response: {}", response);
                return "I'm here for you. Could you tell me more?";
            }

            return text;

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage(), e);
            return "I'm so sorry, I'm having a little trouble connecting right now. But please know your feelings are valid. Can we try talking again in a moment?";
        }
    }

    /**
     * Analyzes a single message for sentiment, emotion, and distress level.
     * Returns a Map with: sentiment (-1 to 1), emotion, distressLevel (0-10),
     * keyThemes
     */
    public Map<String, Object> analyzeMessage(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured, using keyword analysis fallback");
            return keywordAnalysisFallback(message);
        }

        try {
            String analysisPrompt = """
                    Analyze the following student message for mental health indicators.
                    Return ONLY a valid JSON object (no markdown, no code blocks):
                    {"sentiment": <float -1 to 1>, "emotion": "<sad|anxious|angry|fearful|neutral|happy>", "distressLevel": <int 0-10>, "keyThemes": ["<theme1>", "<theme2>"], "cognitivePatterns": "<any detected: catastrophizing, all-or-nothing, mind-reading, or none>"}

                    Student message: "%s"
                    """
                    .formatted(message);

            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> entry = new HashMap<>();
            entry.put("role", "user");
            entry.put("parts", List.of(Map.of("text", analysisPrompt)));
            contents.add(entry);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);

            String response = webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText("{}");

            // Clean up potential markdown code block wrapping
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            return objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            log.warn("Gemini analysis failed, using keyword fallback: {}", e.getMessage());
            return keywordAnalysisFallback(message);
        }
    }

    /**
     * Keyword-based analysis — no API call, safe from rate limits.
     * Used by ChatService for real-time message analysis.
     */
    public Map<String, Object> keywordAnalysisFallback(String message) {
        String lower = message.toLowerCase();
        Map<String, Object> result = new HashMap<>();

        // Comprehensive keyword matching for distress detection
        Map<String, Float> distressKeywords = new HashMap<>();
        // High distress
        distressKeywords.put("hopeless", 0.9f);
        distressKeywords.put("worthless", 0.9f);
        distressKeywords.put("can't go on", 0.95f);
        distressKeywords.put("suicid", 0.99f);
        distressKeywords.put("kill myself", 0.99f);
        distressKeywords.put("end it all", 0.95f);
        distressKeywords.put("self harm", 0.95f);
        distressKeywords.put("give up", 0.85f);
        distressKeywords.put("no point", 0.85f);
        // Medium-high distress
        distressKeywords.put("depressed", 0.8f);
        distressKeywords.put("depression", 0.8f);
        distressKeywords.put("anxious", 0.7f);
        distressKeywords.put("anxiety", 0.7f);
        distressKeywords.put("panic", 0.75f);
        distressKeywords.put("overwhelmed", 0.7f);
        distressKeywords.put("can't sleep", 0.7f);
        distressKeywords.put("insomnia", 0.7f);
        distressKeywords.put("not eating", 0.7f);
        distressKeywords.put("can't eat", 0.7f);
        distressKeywords.put("crying", 0.7f);
        distressKeywords.put("cry", 0.65f);
        // Medium distress
        distressKeywords.put("sad", 0.65f);
        distressKeywords.put("lonely", 0.65f);
        distressKeywords.put("alone", 0.6f);
        distressKeywords.put("isolated", 0.65f);
        distressKeywords.put("scared", 0.6f);
        distressKeywords.put("stressed", 0.6f);
        distressKeywords.put("tired", 0.5f);
        distressKeywords.put("exhausted", 0.6f);
        distressKeywords.put("help me", 0.7f);
        distressKeywords.put("please help", 0.7f);
        distressKeywords.put("not feeling good", 0.6f);
        distressKeywords.put("not feeling well", 0.6f);
        distressKeywords.put("not good", 0.55f);
        distressKeywords.put("tough", 0.5f);
        distressKeywords.put("hell", 0.7f);
        distressKeywords.put("terrible", 0.65f);
        distressKeywords.put("awful", 0.65f);
        distressKeywords.put("miserable", 0.75f);
        distressKeywords.put("angry", 0.55f);
        distressKeywords.put("frustrated", 0.5f);
        distressKeywords.put("nothing interest", 0.7f);
        distressKeywords.put("don't want to", 0.6f);
        distressKeywords.put("don't feel like", 0.6f);
        distressKeywords.put("locked", 0.5f);
        distressKeywords.put("room", 0.3f);
        distressKeywords.put("boring", 0.4f);
        distressKeywords.put("bored", 0.35f);
        distressKeywords.put("no motivation", 0.7f);
        distressKeywords.put("lost interest", 0.7f);
        distressKeywords.put("can't concentrate", 0.6f);
        distressKeywords.put("worry", 0.5f);
        // Additional high-sensitivity patterns
        distressKeywords.put("can't cope", 0.85f);
        distressKeywords.put("nothing matters", 0.9f);
        distressKeywords.put("trapped", 0.8f);
        distressKeywords.put("suffocating", 0.8f);
        distressKeywords.put("numb", 0.75f);
        distressKeywords.put("empty", 0.7f);
        distressKeywords.put("broken", 0.75f);
        distressKeywords.put("falling apart", 0.85f);
        distressKeywords.put("can't breathe", 0.8f);
        distressKeywords.put("racing thoughts", 0.7f);
        distressKeywords.put("heart pounding", 0.65f);
        distressKeywords.put("nightmares", 0.65f);
        distressKeywords.put("flashback", 0.7f);
        distressKeywords.put("dread", 0.7f);
        distressKeywords.put("burden", 0.75f);
        distressKeywords.put("hate myself", 0.9f);
        distressKeywords.put("no one cares", 0.85f);
        distressKeywords.put("all alone", 0.75f);
        distressKeywords.put("can't take it", 0.85f);
        distressKeywords.put("losing my mind", 0.85f);
        distressKeywords.put("want to disappear", 0.9f);
        distressKeywords.put("useless", 0.8f);
        distressKeywords.put("failure", 0.7f);
        distressKeywords.put("ashamed", 0.65f);
        distressKeywords.put("guilty", 0.6f);

        float maxDistress = 0f;
        int matchCount = 0;
        String emotion = "neutral";
        for (Map.Entry<String, Float> entry : distressKeywords.entrySet()) {
            if (lower.contains(entry.getKey())) {
                maxDistress = Math.max(maxDistress, entry.getValue());
                matchCount++;
                if (entry.getValue() >= 0.7f)
                    emotion = "sad";
                else if (entry.getKey().contains("anxi") || entry.getKey().contains("scared")
                        || entry.getKey().contains("panic") || entry.getKey().contains("worry"))
                    emotion = "anxious";
                else if (entry.getKey().contains("angry") || entry.getKey().contains("frustrated"))
                    emotion = "angry";
            }
        }

        // Multiple keyword matches increase the distress level
        if (matchCount >= 3)
            maxDistress = Math.min(1.0f, maxDistress + 0.15f);
        if (matchCount >= 5)
            maxDistress = Math.min(1.0f, maxDistress + 0.1f);

        if (lower.contains("happy") || lower.contains("grateful") || lower.contains("great")
                || lower.contains("wonderful")) {
            emotion = "happy";
            maxDistress = 0.1f;
        }

        result.put("sentiment", maxDistress > 0.4 ? -maxDistress : 0.2);
        result.put("emotion", emotion);
        result.put("distressLevel", (int) (maxDistress * 10));
        result.put("keyThemes", List.of());
        result.put("cognitivePatterns", "none");

        return result;
    }

    /**
     * Generate personalized daily wellness recommendations based on the user's
     * assessment report.
     */
    public String generateRecommendation(String reportContext, int severityScore) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured, using static recommendations");
            return getStaticRecommendation(severityScore);
        }

        try {
            String prompt = """
                    You are a mental health wellness advisor for a student platform called CalmQuest.
                    Based on the following assessment data, generate 5 personalized, actionable, and warm daily wellness recommendations.

                    IMPORTANT RULES:
                    - Be warm, encouraging, and non-clinical in tone.
                    - Each recommendation should be specific and actionable (not generic).
                    - Include a mix of: mindfulness, physical activity, social connection, and self-care.
                    - If severity is high (7-10), gently suggest professional support alongside self-care.
                    - Format each recommendation with an emoji bullet point.
                    - Keep the total response under 500 words.
                    - Do NOT mention specific scores or clinical terms.

                    Severity Level: %d/10

                    %s

                    Generate 5 personalized recommendations:
                    """
                    .formatted(severityScore, reportContext);

            List<Map<String, Object>> contents = new java.util.ArrayList<>();
            Map<String, Object> entry = new java.util.HashMap<>();
            entry.put("role", "user");
            entry.put("parts", List.of(Map.of("text", prompt)));
            contents.add(entry);

            Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("contents", contents);

            String response = webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText(null);

            if (text != null && !text.isBlank()) {
                return text;
            }
        } catch (Exception e) {
            log.error("Failed to generate AI recommendation: {}", e.getMessage());
        }

        return getStaticRecommendation(severityScore);
    }

    /**
     * Fallback static recommendations when Gemini is unavailable.
     */
    private String getStaticRecommendation(int severityScore) {
        if (severityScore >= 7) {
            return """
                    🌟 Reach out to a trusted friend, family member, or counselor today — connection is strength.
                    🧘 Try a 5-minute guided breathing exercise: inhale for 4 counts, hold for 4, exhale for 6.
                    🚶 Take a gentle 10-minute walk outdoors, focusing on the sounds and sights around you.
                    📝 Write down 3 things you're grateful for, no matter how small they seem.
                    💚 Remember: seeking professional support is a sign of courage, not weakness. Consider booking an appointment.""";
        } else if (severityScore >= 4) {
            return """
                    🌅 Start your day with 5 minutes of mindful stretching before checking your phone.
                    💧 Stay hydrated — aim for 8 glasses of water today and notice how your body feels.
                    🎵 Create a playlist of songs that lift your mood and listen during a break.
                    🤝 Reach out to someone you haven't spoken to in a while — even a brief text counts.
                    🌙 Tonight, try putting your phone away 30 minutes before bed for better sleep.""";
        } else {
            return """
                    ☀️ You're doing great! Challenge yourself with one new activity today — try a new recipe or walk a different route.
                    🧠 Spend 10 minutes learning something new that excites you — a podcast, article, or skill.
                    🏃 Get your heart rate up with 20 minutes of exercise you enjoy.
                    😊 Do one random act of kindness today — it boosts both your mood and someone else's.
                    📖 End your day by reflecting on your best moment — savor it.""";
        }
    }
}
