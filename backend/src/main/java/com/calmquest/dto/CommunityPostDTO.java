package com.calmquest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostDTO {
    private Long id;
    private String content;
    private String imageUrl;
    private String videoUrl;
    private Boolean isAnonymous;
    private Boolean isPinned;
    private Boolean isEdited;
    private Integer likesCount;
    private Integer commentsCount;
    private List<String> hashtags;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Author info (null if anonymous)
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private String authorRole;

    // Current user context
    private Boolean likedByCurrentUser;
    private Boolean bookmarkedByCurrentUser;

    // Emoji reactions: emoji -> count
    private Map<String, Integer> reactions;
    // Which emojis current user has reacted with
    private List<String> currentUserReactions;

    // Media carousel
    private List<MediaItem> media;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaItem {
        private Long id;
        private String url;
        private String mediaType;
        private Integer displayOrder;
    }
}
