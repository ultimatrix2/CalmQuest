package com.calmquest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {
    private String aiMessage;
    private Long sessionId;
    private Long messageId;
    private Boolean assessmentTriggered;
    private AssessmentQuestionDTO firstQuestion;
}
