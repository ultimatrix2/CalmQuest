package com.calmquest.service;

import com.calmquest.dto.AssessmentQuestionDTO;
import com.calmquest.entity.*;
import com.calmquest.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final AssessmentResultRepository assessmentResultRepository;
    private final AIReportRepository aiReportRepository;
    private final FacialEmotionLogRepository facialEmotionLogRepository;
    private final VoiceAnalysisLogRepository voiceAnalysisLogRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    // ==================== QUESTION BANKS ====================

    // GHQ-12: General Health Questionnaire (GHQ scoring: 0-0-1-1)
    private static final List<String> GHQ12_QUESTIONS = List.of(
        "Have you been able to concentrate on what you're doing?",
        "Have you lost much sleep over worry?",
        "Have you felt that you are playing a useful part in things?",
        "Have you felt capable of making decisions about things?",
        "Have you felt constantly under strain?",
        "Have you felt you couldn't overcome your difficulties?",
        "Have you been able to enjoy your normal day-to-day activities?",
        "Have you been able to face up to your problems?",
        "Have you been feeling unhappy and depressed?",
        "Have you been losing confidence in yourself?",
        "Have you been thinking of yourself as a worthless person?",
        "Have you been feeling reasonably happy, all things considered?"
    );

    private static final List<List<String>> GHQ12_OPTIONS = List.of(
        List.of("Better than usual", "Same as usual", "Less than usual", "Much less than usual"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("More so than usual", "Same as usual", "Less useful than usual", "Much less useful"),
        List.of("More so than usual", "Same as usual", "Less so than usual", "Much less capable"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("More so than usual", "Same as usual", "Less so than usual", "Much less than usual"),
        List.of("More so than usual", "Same as usual", "Less able than usual", "Much less able"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("Not at all", "No more than usual", "Rather more than usual", "Much more than usual"),
        List.of("More so than usual", "About same as usual", "Less so than usual", "Much less than usual")
    );

    // GHQ scoring: positive items (0,2,3,6,7,11) score 0-0-1-1; negative items (1,4,5,8,9,10) score 0-0-1-1
    private static final Set<Integer> GHQ12_NEGATIVE_ITEMS = Set.of(1, 4, 5, 8, 9, 10);

    // PHQ-9: Patient Health Questionnaire
    private static final List<String> PHQ9_QUESTIONS = List.of(
        "Little interest or pleasure in doing things?",
        "Feeling down, depressed, or hopeless?",
        "Trouble falling or staying asleep, or sleeping too much?",
        "Feeling tired or having little energy?",
        "Poor appetite or overeating?",
        "Feeling bad about yourself — or that you are a failure?",
        "Trouble concentrating on things, such as reading or watching TV?",
        "Moving or speaking so slowly that others could have noticed? Or being so restless?",
        "Thoughts that you would be better off dead, or of hurting yourself?"
    );

    private static final List<String> PHQ9_OPTIONS = List.of(
        "Not at all", "Several days", "More than half the days", "Nearly every day"
    );

    // GAD-7: Generalized Anxiety Disorder
    private static final List<String> GAD7_QUESTIONS = List.of(
        "Feeling nervous, anxious, or on edge?",
        "Not being able to stop or control worrying?",
        "Worrying too much about different things?",
        "Trouble relaxing?",
        "Being so restless that it's hard to sit still?",
        "Becoming easily annoyed or irritable?",
        "Feeling afraid as if something awful might happen?"
    );

    private static final List<String> GAD7_OPTIONS = List.of(
        "Not at all", "Several days", "More than half the days", "Nearly every day"
    );

    // ==================== ASSESSMENT FLOW ====================

    /**
     * Get the next question for a given test type and index.
     */
    public AssessmentQuestionDTO getQuestion(AssessmentResult.TestType testType, int questionIndex) {
        List<String> questions;
        List<String> options;
        int total;

        switch (testType) {
            case GHQ12:
                questions = GHQ12_QUESTIONS;
                options = GHQ12_OPTIONS.get(questionIndex);
                total = 12;
                break;
            case PHQ9:
                questions = PHQ9_QUESTIONS;
                options = PHQ9_OPTIONS;
                total = 9;
                break;
            case GAD7:
                questions = GAD7_QUESTIONS;
                options = GAD7_OPTIONS;
                total = 7;
                break;
            default:
                throw new IllegalArgumentException("Unknown test type: " + testType);
        }

        if (questionIndex >= questions.size()) return null; // All done

        return AssessmentQuestionDTO.builder()
                .questionIndex(questionIndex)
                .questionText(questions.get(questionIndex))
                .options(options)
                .testType(testType.name())
                .totalQuestions(total)
                .build();
    }

    /**
     * Calculate score for completed assessment.
     */
    public AssessmentResult calculateResult(ChatSession session, User student,
                                            AssessmentResult.TestType testType, List<Integer> answers) {
        int totalScore = 0;
        int maxScore;
        Integer q9Score = null;

        switch (testType) {
            case GHQ12:
                // GHQ scoring: 0-0-1-1 method
                for (int i = 0; i < answers.size(); i++) {
                    totalScore += (answers.get(i) >= 2) ? 1 : 0;
                }
                maxScore = 12;
                break;
            case PHQ9:
                for (int answer : answers) totalScore += answer;
                maxScore = 27;
                q9Score = answers.size() >= 9 ? answers.get(8) : 0; // Q9 check
                break;
            case GAD7:
                for (int answer : answers) totalScore += answer;
                maxScore = 21;
                break;
            default:
                throw new IllegalArgumentException("Unknown test type");
        }

        AssessmentResult.Severity severity = calculateSeverity(testType, totalScore);
        boolean thresholdCrossed = isThresholdCrossed(testType, totalScore);

        String answersJson;
        try {
            answersJson = objectMapper.writeValueAsString(answers);
        } catch (Exception e) {
            answersJson = answers.toString();
        }

        AssessmentResult result = AssessmentResult.builder()
                .student(student)
                .session(session)
                .testType(testType)
                .totalScore(totalScore)
                .maxScore(maxScore)
                .severity(severity)
                .answers(answersJson)
                .q9Score(q9Score)
                .thresholdCrossed(thresholdCrossed)
                .build();

        return assessmentResultRepository.save(result);
    }

    /**
     * Determine severity level based on test type and score.
     */
    private AssessmentResult.Severity calculateSeverity(AssessmentResult.TestType testType, int score) {
        return switch (testType) {
            case GHQ12 -> score < 4 ? AssessmentResult.Severity.MINIMAL : AssessmentResult.Severity.MODERATE;
            case PHQ9 -> {
                if (score <= 4) yield AssessmentResult.Severity.MINIMAL;
                if (score <= 9) yield AssessmentResult.Severity.MILD;
                if (score <= 14) yield AssessmentResult.Severity.MODERATE;
                if (score <= 19) yield AssessmentResult.Severity.MODERATELY_SEVERE;
                yield AssessmentResult.Severity.SEVERE;
            }
            case GAD7 -> {
                if (score <= 4) yield AssessmentResult.Severity.MINIMAL;
                if (score <= 9) yield AssessmentResult.Severity.MILD;
                if (score <= 14) yield AssessmentResult.Severity.MODERATE;
                yield AssessmentResult.Severity.SEVERE;
            }
        };
    }

    /**
     * Check if threshold is crossed to trigger next test.
     * GHQ-12 >= 4 → trigger PHQ-9
     * PHQ-9 >= 10 → trigger GAD-7
     */
    private boolean isThresholdCrossed(AssessmentResult.TestType testType, int score) {
        return switch (testType) {
            case GHQ12 -> score >= 4;
            case PHQ9 -> score >= 10;
            case GAD7 -> false; // Last test, no cascade
        };
    }

    /**
     * Determine which test should come next, if any.
     */
    public AssessmentResult.TestType getNextTest(AssessmentResult.TestType currentTest, boolean crossed) {
        if (!crossed) return null;
        return switch (currentTest) {
            case GHQ12 -> AssessmentResult.TestType.PHQ9;
            case PHQ9 -> AssessmentResult.TestType.GAD7;
            case GAD7 -> null;
        };
    }

    /**
     * Generate the final AI report after all assessments.
     */
    public AIReport generateReport(ChatSession session, User student) {
        List<AssessmentResult> results = assessmentResultRepository.findBySession(session);
        List<ChatMessage> messages = chatMessageRepository.findBySessionOrderByTimestampAsc(session);
        List<FacialEmotionLog> facialLogs = facialEmotionLogRepository.findBySessionOrderByTimestampAsc(session);

        Integer ghq = null, phq = null, gad = null;
        Integer q9 = null;
        for (AssessmentResult r : results) {
            switch (r.getTestType()) {
                case GHQ12 -> ghq = r.getTotalScore();
                case PHQ9 -> { phq = r.getTotalScore(); q9 = r.getQ9Score(); }
                case GAD7 -> gad = r.getTotalScore();
            }
        }

        // Calculate text sentiment and distress
        float avgSentiment = 0f;
        int sentimentCount = 0;
        int maxDistress = 0;
        float recentSentiment = 0f;
        int recentCount = 0;
        int msgIndex = 0;

        for (ChatMessage msg : messages) {
            if (msg.getSender() == ChatMessage.SenderType.STUDENT) {
                if (msg.getSentimentScore() != null) {
                    avgSentiment += msg.getSentimentScore();
                    sentimentCount++;
                    // Consider last 3 messages as "recent" for peak-end rule
                    if (messages.size() - msgIndex <= 3) {
                        recentSentiment += msg.getSentimentScore();
                        recentCount++;
                    }
                }
                if (msg.getDistressLevel() != null) {
                    maxDistress = Math.max(maxDistress, msg.getDistressLevel());
                }
            }
            msgIndex++;
        }

        // Apply Peak-End Rule: 60% weight to highest distress, 40% to recent sentiment
        float sentimentDistress = 0f;
        if (sentimentCount > 0) {
            float recentScore = recentCount > 0 ? Math.max(0, -recentSentiment / recentCount) * 10 : 0;
            sentimentDistress = (maxDistress * 0.6f) + (recentScore * 0.4f);
        }

        // Calculate facial distress
        float facialDistress = 0f;
        if (!facialLogs.isEmpty()) {
            long negativeCount = facialLogs.stream()
                .filter(f -> List.of("sad", "angry", "fearful", "disgusted").contains(f.getDominantEmotion()))
                .count();
            facialDistress = ((float) negativeCount / facialLogs.size()) * 10;
        }

        // Calculate voice distress from voice analysis logs
        List<VoiceAnalysisLog> voiceLogs = voiceAnalysisLogRepository.findBySessionOrderByTimestampAsc(session);
        float voiceDistress = 0f;
        String voiceSummaryText = null;
        if (!voiceLogs.isEmpty()) {
            // Average negative sentiment from voice transcripts
            float avgVoiceSentiment = 0f;
            int voiceSentimentCount = 0;
            long slowCount = 0, fastCount = 0;
            int totalDuration = 0;
            int totalWords = 0;
            Map<String, Integer> voiceEmotionCounts = new HashMap<>();

            for (VoiceAnalysisLog v : voiceLogs) {
                if (v.getSentimentScore() != null) {
                    avgVoiceSentiment += v.getSentimentScore();
                    voiceSentimentCount++;
                }
                if ("slow".equals(v.getSpeechRate())) slowCount++;
                else if ("fast".equals(v.getSpeechRate())) fastCount++;
                if (v.getDurationSeconds() != null) totalDuration += v.getDurationSeconds();
                if (v.getWordCount() != null) totalWords += v.getWordCount();
                if (v.getDetectedEmotion() != null) {
                    voiceEmotionCounts.merge(v.getDetectedEmotion(), 1, Integer::sum);
                }
            }

            // Sentiment component: negative sentiment → higher distress
            float sentimentComponent = voiceSentimentCount > 0 ?
                    Math.max(0, -avgVoiceSentiment / voiceSentimentCount) * 10 : 0;

            // Speech rate abnormality: slow or fast speech
            float rateAbnormality = 0f;
            long totalVoice = voiceLogs.size();
            float abnormalPct = (float)(slowCount + fastCount) / totalVoice;
            // Cap at 2.5 points max for abnormal speech rate to prevent simple silence from over-inflating scores
            rateAbnormality = abnormalPct * 2.5f;

            voiceDistress = Math.min(10, (sentimentComponent * 0.85f) + (rateAbnormality * 0.15f));

            // Build voice summary
            String dominantVoiceEmotion = voiceEmotionCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse("neutral");
            voiceSummaryText = String.format(
                    "Voice analysis: %d recording(s), %ds total, %d words. Dominant emotion: %s. Speech rate: %d%% abnormal (slow/fast).",
                    voiceLogs.size(), totalDuration, totalWords, dominantVoiceEmotion,
                    Math.round(abnormalPct * 100));
        }

        // Combined severity formula using Dynamic Weighting & Severity Band Mapping
        
        // GHQ Maps: Minimal (1-2), Moderate (5-8), Severe(9-10)
        float ghqNorm = 0f;
        if (ghq != null) {
            if (ghq <= 3) ghqNorm = (ghq / 3f) * 2; // 0-2
            else ghqNorm = 2 + ((ghq - 3f) / 9f) * 8; // 2-10
        }

        // PHQ Maps: Minimal(0-4) -> 1-2, Mild(5-9) -> 3-4, Moderate(10-14) -> 5-7, Severe(15+) -> 8-10
        float phqNorm = 0f;
        if (phq != null) {
            if (phq <= 4) phqNorm = 2f;
            else if (phq <= 9) phqNorm = 4f;
            else if (phq <= 14) phqNorm = 7f;
            else if (phq <= 19) phqNorm = 9f;
            else phqNorm = 10f;
        }

        // GAD Maps: Minimal(0-4) -> 2, Mild(5-9) -> 4, Moderate(10-14) -> 7, Severe(15+) -> 10
        float gadNorm = 0f;
        if (gad != null) {
            if (gad <= 4) gadNorm = 2f;
            else if (gad <= 9) gadNorm = 4f;
            else if (gad <= 14) gadNorm = 7f;
            else gadNorm = 10f;
        }

        // Base Weights
        float ghqWeight = 0.20f;
        float phqWeight = 0.30f;
        float gadWeight = 0.20f;
        float textWeight = 0.10f;
        float faceWeight = 0.10f;
        float voiceWeight = 0.10f;

        // Dynamic Weight Redistribution
        boolean hasFacial = !facialLogs.isEmpty();
        boolean hasVoice = voiceLogs != null && !voiceLogs.isEmpty();
        float undistributedWeight = 0f;

        if (!hasFacial) {
            undistributedWeight += faceWeight;
            faceWeight = 0f;
        }
        if (!hasVoice) {
            undistributedWeight += voiceWeight;
            voiceWeight = 0f;
        }

        if (undistributedWeight > 0) {
            // Distribute proportionally to the clinical tests
            float clinicalTotal = ghqWeight + phqWeight + gadWeight;
            ghqWeight += undistributedWeight * (ghqWeight / clinicalTotal);
            phqWeight += undistributedWeight * (phqWeight / clinicalTotal);
            gadWeight += undistributedWeight * (gadWeight / clinicalTotal);
        }

        float combined = (ghqNorm * ghqWeight)
                + (phqNorm * phqWeight)
                + (gadNorm * gadWeight)
                + (sentimentDistress * textWeight)
                + (facialDistress * faceWeight)
                + (voiceDistress * voiceWeight);

        combined = Math.max(1, Math.min(10, Math.round(combined)));

        // Determine action
        AIReport.ActionTaken action;
        if (q9 != null && q9 > 0) {
            action = AIReport.ActionTaken.CRISIS_INTERVENTION;
        } else if (combined >= 9) {
            action = AIReport.ActionTaken.URGENT_REFERRAL;
        } else if (combined >= 7) {
            action = AIReport.ActionTaken.SUGGEST_DOCTOR;
        } else {
            action = AIReport.ActionTaken.SELF_HELP;
        }

        // Build summary
        String summary = buildSummary(results, combined, action);
        String recommendations = buildRecommendations(action, combined);

        // Find dominant facial emotion
        String facialSummary = null;
        String emotionBreakdownJson = null;
        if (!facialLogs.isEmpty()) {
            Map<String, Long> emotionCounts = new HashMap<>();
            for (FacialEmotionLog f : facialLogs) {
                emotionCounts.merge(f.getDominantEmotion(), 1L, Long::sum);
            }
            String dominant = emotionCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("neutral");
            long pct = (emotionCounts.getOrDefault(dominant, 0L) * 100) / facialLogs.size();
            facialSummary = "Dominant expression: " + dominant + " (" + pct + "% of session)";
            
            // Calculate percentages for emotionBreakdown UI
            Map<String, Double> breakdownMap = new HashMap<>();
            for (Map.Entry<String, Long> entry : emotionCounts.entrySet()) {
                breakdownMap.put(entry.getKey(), (double) entry.getValue() / facialLogs.size());
            }
            try {
                emotionBreakdownJson = objectMapper.writeValueAsString(breakdownMap);
            } catch (Exception e) {
                emotionBreakdownJson = "{}";
            }
        }

        String sentimentSummaryText = String.format("Assessed via peak-end rule. Max distress: %d/10. Average session sentiment: %.2f.",
                maxDistress, session.getOverallSentiment());

        AIReport report = AIReport.builder()
                .student(student)
                .session(session)
                .ghq12Score(ghq)
                .phq9Score(phq)
                .gad7Score(gad)
                .combinedSeverityScore(combined)
                .severityScore((int) combined)
                .emotionBreakdown(emotionBreakdownJson)
                .sentimentDistressScore(sentimentDistress)
                .facialDistressScore(facialDistress)
                .voiceDistressScore(voiceDistress)
                .summary(summary)
                .recommendedActions(recommendations)
                .facialSummary(facialSummary)
                .voiceSummary(voiceSummaryText)
                .sentimentSummary(sentimentSummaryText)
                .actionTaken(action)
                .build();

        return aiReportRepository.save(report);
    }

    private String buildSummary(List<AssessmentResult> results, float combined, AIReport.ActionTaken action) {
        StringBuilder sb = new StringBuilder();

        if (results.isEmpty()) {
            sb.append("Based on your conversation analysis, ");
            if (combined >= 7) sb.append("significant emotional distress was detected. ");
            else if (combined >= 4) sb.append("moderate emotional distress was noted. ");
            else sb.append("your emotional state appears stable. ");
            sb.append("We recommend completing the well-being assessments for a more detailed evaluation.");
        } else {
            sb.append("Based on your well-being assessment, your combined score is ")
              .append(String.format("%.1f", combined)).append("/10. ");
            for (AssessmentResult r : results) {
                sb.append(r.getTestType().name()).append(": ")
                  .append(r.getTotalScore()).append("/").append(r.getMaxScore())
                  .append(" (").append(r.getSeverity().name().toLowerCase().replace('_', ' ')).append("). ");
            }
        }

        return sb.toString();
    }

    private String buildRecommendations(AIReport.ActionTaken action, float combined) {
        return switch (action) {
            case SELF_HELP -> "• Practice daily mindfulness or breathing exercises\n• Maintain a regular sleep schedule\n• Stay connected with friends and family\n• Consider journaling about your feelings";
            case SUGGEST_DOCTOR -> "• We recommend scheduling an appointment with a counselor\n• Talk to a trusted friend or family member\n• Practice stress-reduction techniques\n• Contact your campus counseling center";
            case URGENT_REFERRAL, CRISIS_INTERVENTION -> "🏫 On Campus\n• Contact your College Counselor / Wellness Center\n• Inform your Faculty Advisor / Warden\n\n⚠️ Emergency\n• Go to the nearest hospital emergency room\n• Call local emergency services (112)";
        };
    }
}
