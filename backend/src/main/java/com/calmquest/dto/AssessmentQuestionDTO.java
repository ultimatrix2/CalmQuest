package com.calmquest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentQuestionDTO {
    private int questionIndex;
    private String questionText;
    private List<String> options;
    private String testType;
    private int totalQuestions;
}
