package com.calmquest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentAnswerDTO {
    private String testType;
    private int questionIndex;
    private int answer; // 0-3
}
