package com.calmquest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialEmotionDTO {
    private String emotion;
    private Float confidence;
    private Map<String, Float> allScores;
}
