package com.calmquest.service;

import com.calmquest.dto.CommunityPostDTO;
import com.calmquest.entity.*;
import com.calmquest.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository postRepository;
    private final PostCommentRepository commentRepository;
    private final PostLikeRepository likeRepository;
    private final PostReactionRepository reactionRepository;
    private final PostReportRepository reportRepository;
    private final PostBookmarkRepository bookmarkRepository;
    private final PostMediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    // ─── Feed ───────────────────────────────────────────────

    private void checkCommunityAccess(User user) {
        if (user.getRole() == User.Role.SUPER_ADMIN) {
            return;
        }
        if (user.getCommunityStatus() != User.CommunityStatus.APPROVED) {
            String approver = user.getRole() == User.Role.COLLEGE_ADMIN ? "the Super Admin" : "your College Admin";
            throw new RuntimeException("You must be verified by " + approver + " to access the community");
        }
    }

    public Page<CommunityPostDTO> getFeed(User currentUser, Pageable pageable, String sort, String search, String category) {
        checkCommunityAccess(currentUser);
        College college = currentUser.getCollege();
        Page<CommunityPost> posts;

        if (search != null && !search.isBlank()) {
            posts = postRepository.searchByCollegeAndContent(college, search.trim(), pageable);
        } else if (category != null && !category.isBlank() && !category.equals("All")) {
            posts = postRepository.findByCollegeAndCategory(college, category, pageable);
        } else {
            posts = switch (sort != null ? sort : "recent") {
                case "oldest" -> postRepository.findByCollegeOrderByIsPinnedDescCreatedAtAsc(college, pageable);
                case "most_liked" -> postRepository.findByCollegeOrderByIsPinnedDescLikesCountDesc(college, pageable);
                case "least_liked" -> postRepository.findByCollegeOrderByIsPinnedDescLikesCountAsc(college, pageable);
                case "most_commented" -> postRepository.findByCollegeOrderByIsPinnedDescCommentsCountDesc(college, pageable);
                default -> postRepository.findByCollegeOrderByIsPinnedDescCreatedAtDesc(college, pageable);
            };
        }

        return posts.map(post -> toDTO(post, currentUser));
    }

    // ─── Get Single Post ────────────────────────────────────

    public CommunityPostDTO getPost(Long postId, User currentUser) {
        checkCommunityAccess(currentUser);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getCollege().getId().equals(currentUser.getCollege().getId())) {
             throw new RuntimeException("You cannot access posts from other colleges");
        }
        return toDTO(post, currentUser);
    }

    // ─── Create Post ────────────────────────────────────────

    @Transactional
    public CommunityPostDTO createPost(User author, String content, List<String> hashtags,
                                        Boolean isAnonymous, String category,
                                        List<MultipartFile> mediaFiles) {
        checkCommunityAccess(author);
        CommunityPost post = CommunityPost.builder()
                .content(content)
                .author(author)
                .college(author.getCollege())
                .isAnonymous(isAnonymous != null ? isAnonymous : false)
                .hashtags(hashtags != null ? hashtags : new ArrayList<>())
                .category(category)
                .build();

        // Auto-extract hashtags from content
        List<String> extractedTags = extractHashtags(content);
        if (post.getHashtags() == null) {
            post.setHashtags(extractedTags);
        } else {
            // Merge unique
            Set<String> uniqueTags = new HashSet<>(post.getHashtags());
            uniqueTags.addAll(extractedTags);
            post.setHashtags(new ArrayList<>(uniqueTags));
        }

        CommunityPost saved = postRepository.save(post);

        // Handle multiple media files
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            int order = 0;
            for (MultipartFile file : mediaFiles) {
                if (file != null && !file.isEmpty()) {
                    String url = cloudinaryService.uploadFile(file);
                    String contentType = file.getContentType();
                    PostMedia.MediaType mType = (contentType != null && contentType.startsWith("video"))
                            ? PostMedia.MediaType.VIDEO : PostMedia.MediaType.IMAGE;

                    PostMedia media = PostMedia.builder()
                            .post(saved)
                            .url(url)
                            .mediaType(mType)
                            .displayOrder(order++)
                            .build();
                    mediaRepository.save(media);

                    // Also set legacy fields for backward compat (first media only)
                    if (order == 1) {
                        if (mType == PostMedia.MediaType.VIDEO) {
                            saved.setVideoUrl(url);
                        } else {
                            saved.setImageUrl(url);
                        }
                    }
                }
            }
            saved = postRepository.save(saved);
        }
        
        processMentions(saved, content, author);

        return toDTO(saved, author);
    }

    // ─── Edit Post ──────────────────────────────────────────

    @Transactional
    public CommunityPostDTO editPost(Long postId, User user, String content, String category) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Only the author can edit this post");
        }

        post.setContent(content);
        post.setIsEdited(true);
        if (category != null) {
            post.setCategory(category);
        }

        // Re-extract hashtags from content
        List<String> tags = extractHashtags(content);
        post.setHashtags(tags);

        CommunityPost saved = postRepository.save(post);
        
        processMentions(saved, content, user);
        
        return toDTO(saved, user);
    }

    // ─── Delete Post ────────────────────────────────────────

    @Transactional
    public void deletePost(Long postId, User user) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean isAuthor = post.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == User.Role.SUPER_ADMIN
                || user.getRole() == User.Role.COLLEGE_ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new RuntimeException("Not authorized to delete this post");
        }

        postRepository.delete(post);
    }

    // ─── Reactions ──────────────────────────────────────────

    @Transactional
    public CommunityPostDTO toggleReaction(Long postId, User user, String emoji) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<PostReaction> existing = reactionRepository.findByUserAndPostAndEmoji(user, post, emoji);

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
        } else {
            PostReaction reaction = PostReaction.builder()
                    .user(user)
                    .post(post)
                    .emoji(emoji)
                    .build();
            reactionRepository.save(reaction);
            post.setLikesCount(post.getLikesCount() + 1);
        }

        CommunityPost saved = postRepository.save(post);
        return toDTO(saved, user);
    }

    // ─── Legacy Like (wraps reaction with ❤️) ────────────────

    @Transactional
    public CommunityPostDTO toggleLike(Long postId, User user) {
        return toggleReaction(postId, user, "❤️");
    }

    // ─── Report ─────────────────────────────────────────────

    @Transactional
    public Map<String, Object> reportPost(Long postId, User reporter, String reason, String description) {
        checkCommunityAccess(reporter);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (reportRepository.existsByReporterAndPost(reporter, post)) {
            throw new RuntimeException("You have already reported this post");
        }

        PostReport report = PostReport.builder()
                .reporter(reporter)
                .post(post)
                .reason(PostReport.ReportReason.valueOf(reason))
                .description(description)
                .build();
        reportRepository.save(report);

        // Notify all college admins in the reporter's college
        List<User> collegeAdmins = userRepository.findByCollegeAndRole(reporter.getCollege(), User.Role.COLLEGE_ADMIN);
        
        for (User admin : collegeAdmins) {
            String msg = "A post has been reported for: " + reason.replace("_", " ");
            notificationService.createNotification(admin, msg, Notification.NotificationType.SYSTEM, "/dashboard/admin");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Report submitted. The community admin has been notified.");
        return result;
    }

    // ─── Bookmark ───────────────────────────────────────────

    @Transactional
    public CommunityPostDTO toggleBookmark(Long postId, User user) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<PostBookmark> existing = bookmarkRepository.findByUserAndPost(user, post);

        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
        } else {
            PostBookmark bookmark = PostBookmark.builder().user(user).post(post).build();
            bookmarkRepository.save(bookmark);
        }

        return toDTO(post, user);
    }

    public Page<CommunityPostDTO> getUserBookmarks(User user, Pageable pageable) {
        checkCommunityAccess(user);
        Page<PostBookmark> bookmarks = bookmarkRepository.findAllByUserOrderByCreatedAtDesc(user, pageable);
        return bookmarks.map(b -> toDTO(b.getPost(), user));
    }

    // ─── Comments (threaded) ────────────────────────────────

    @Transactional
    public Map<String, Object> addComment(Long postId, User author, String content, Boolean isAnonymous) {
        checkCommunityAccess(author);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        PostComment comment = PostComment.builder()
                .content(content)
                .author(author)
                .post(post)
                .isAnonymous(isAnonymous != null ? isAnonymous : false)
                .build();

        commentRepository.save(comment);
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);
        
        processMentionsInComment(post, comment, content, author);

        return commentToMap(comment);
    }

    @Transactional
    public Map<String, Object> addReply(Long postId, Long parentCommentId, User author, String content, Boolean isAnonymous) {
        checkCommunityAccess(author);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        PostComment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        PostComment reply = PostComment.builder()
                .content(content)
                .author(author)
                .post(post)
                .parentComment(parent)
                .isAnonymous(isAnonymous != null ? isAnonymous : false)
                .build();

        commentRepository.save(reply);
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);
        
        processMentionsInComment(post, reply, content, author);

        return commentToMap(reply);
    }

    public List<Map<String, Object>> getComments(Long postId, User user) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getCollege().getId().equals(user.getCollege().getId())) {
             throw new RuntimeException("You cannot access comments from other colleges");
        }
        List<PostComment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        return comments.stream().map(this::commentToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getThreadedComments(Long postId, User user) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getCollege().getId().equals(user.getCollege().getId())) {
             throw new RuntimeException("You cannot access comments from other colleges");
        }
        List<PostComment> topLevel = commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtDesc(postId);
        return topLevel.stream().map(this::commentToThreadedMap).collect(Collectors.toList());
    }

    // ─── User search (for @mentions) ────────────────────────

    public List<Map<String, Object>> searchUsers(String query, User searcher) {
        checkCommunityAccess(searcher);
        List<User> users = userRepository.findByFullNameContainingIgnoreCase(query);
        return users.stream()
                .filter(u -> u.getCollege() != null && searcher.getCollege() != null && u.getCollege().getId().equals(searcher.getCollege().getId()))
                .limit(10).map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("fullName", u.getFullName());
            map.put("profilePicture", u.getProfilePicture());
            return map;
        }).collect(Collectors.toList());
    }

    // ─── Stats ──────────────────────────────────────────────

    public Map<String, Object> getStats(User user) {
        checkCommunityAccess(user);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts", postRepository.countByCollege(user.getCollege()));
        stats.put("activeUsers", postRepository.findDistinctAuthorIdsByCollege(user.getCollege()).size());
        return stats;
    }

    // ─── Trending Tags ──────────────────────────────────────

    public List<Map<String, Object>> getTrendingTags(User user) {
        checkCommunityAccess(user);
        List<Object[]> results = postRepository.findTrendingHashtagsByCollege(user.getCollege(), java.time.LocalDateTime.now().minusDays(7), PageRequest.of(0, 10));
        return results.stream().map(row -> {
            Map<String, Object> tag = new HashMap<>();
            tag.put("tag", row[0]);
            tag.put("count", row[1]);
            return tag;
        }).collect(Collectors.toList());
    }

    // ─── Pin / Unpin ────────────────────────────────────────

    @Transactional
    public CommunityPostDTO togglePin(Long postId, User user) {
        checkCommunityAccess(user);
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setIsPinned(!post.getIsPinned());
        CommunityPost saved = postRepository.save(post);
        return toDTO(saved, user);
    }

    // ─── Helpers ────────────────────────────────────────────

    private List<String> extractHashtags(String text) {
        List<String> tags = new ArrayList<>();
        if (text == null) return tags;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("#(\\w+)").matcher(text);
        while (m.find()) {
            String tag = m.group(1).toLowerCase();
            if (!tags.contains(tag)) tags.add(tag);
        }
        return tags;
    }

    private void processMentions(CommunityPost post, String content, User sender) {
        if (content == null) return;
        // Match @Name_Surname or @Name
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("@([\\w]+)").matcher(content);
        Set<String> mentionedNames = new HashSet<>();
        while (m.find()) {
            mentionedNames.add(m.group(1));
        }

        for (String rawName : mentionedNames) {
             // Replace underscores with spaces for search (if we use underscores for spaces in mentions)
             String query = rawName.replace("_", " ");
             List<User> users = userRepository.findByFullNameContainingIgnoreCase(query);
             for (User taggedUser : users) {
                 if (!taggedUser.getId().equals(sender.getId())) {
                     String msg = sender.getFullName() + " tagged you in a post.";
                     notificationService.createNotification(taggedUser, msg, Notification.NotificationType.SYSTEM, "/dashboard/community?postId=" + post.getId());
                 }
             }
        }
    }

    private void processMentionsInComment(CommunityPost post, PostComment comment, String content, User sender) {
        if (content == null) return;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("@([\\w]+)").matcher(content);
        Set<String> mentionedNames = new HashSet<>();
        while (m.find()) {
            mentionedNames.add(m.group(1));
        }

        for (String rawName : mentionedNames) {
             String query = rawName.replace("_", " ");
             List<User> users = userRepository.findByFullNameContainingIgnoreCase(query);
             for (User taggedUser : users) {
                 if (!taggedUser.getId().equals(sender.getId())) {
                     String msg = sender.getFullName() + " tagged you in a comment.";
                     notificationService.createNotification(taggedUser, msg, Notification.NotificationType.SYSTEM, "/dashboard/community?postId=" + post.getId());
                 }
             }
        }
    }

    private CommunityPostDTO toDTO(CommunityPost post, User currentUser) {
        boolean liked = likeRepository.existsByUserAndPost(currentUser, post);
        boolean bookmarked = bookmarkRepository.existsByUserAndPost(currentUser, post);

        // Reactions aggregate
        List<Object[]> reactionCounts = reactionRepository.countByPostGroupByEmoji(post);
        Map<String, Integer> reactionsMap = new LinkedHashMap<>();
        for (Object[] row : reactionCounts) {
            reactionsMap.put((String) row[0], ((Long) row[1]).intValue());
        }
        List<String> userReactions = reactionRepository.findEmojisByUserAndPost(currentUser, post);

        // Media list
        List<PostMedia> mediaItems = mediaRepository.findByPostIdOrderByDisplayOrderAsc(post.getId());
        List<CommunityPostDTO.MediaItem> mediaList = mediaItems.stream()
                .map(m -> CommunityPostDTO.MediaItem.builder()
                        .id(m.getId())
                        .url(m.getUrl())
                        .mediaType(m.getMediaType().name())
                        .displayOrder(m.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        CommunityPostDTO.CommunityPostDTOBuilder builder = CommunityPostDTO.builder()
                .id(post.getId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .videoUrl(post.getVideoUrl())
                .isAnonymous(post.getIsAnonymous())
                .isPinned(post.getIsPinned())
                .isEdited(post.getIsEdited())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .hashtags(post.getHashtags())
                .category(post.getCategory())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .likedByCurrentUser(liked)
                .bookmarkedByCurrentUser(bookmarked)
                .reactions(reactionsMap)
                .currentUserReactions(userReactions)
                .media(mediaList);

        if (Boolean.TRUE.equals(post.getIsAnonymous())) {
            builder.authorId(null)
                   .authorName("Anonymous")
                   .authorAvatar(null)
                   .authorRole(null);
        } else {
            User author = post.getAuthor();
            builder.authorId(author.getId())
                   .authorName(author.getFullName())
                   .authorAvatar(author.getProfilePicture())
                   .authorRole(author.getRole() != null ? author.getRole().name() : null);
        }

        return builder.build();
    }

    private Map<String, Object> commentToMap(PostComment comment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", comment.getId());
        map.put("content", comment.getContent());
        map.put("isAnonymous", comment.getIsAnonymous());
        map.put("createdAt", comment.getCreatedAt());
        map.put("parentCommentId", comment.getParentComment() != null ? comment.getParentComment().getId() : null);

        if (Boolean.TRUE.equals(comment.getIsAnonymous())) {
            map.put("authorName", "Anonymous");
            map.put("authorAvatar", null);
        } else {
            map.put("authorName", comment.getAuthor().getFullName());
            map.put("authorAvatar", comment.getAuthor().getProfilePicture());
        }
        return map;
    }

    private Map<String, Object> commentToThreadedMap(PostComment comment) {
        Map<String, Object> map = commentToMap(comment);
        List<PostComment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId());
        map.put("replies", replies.stream().map(this::commentToMap).collect(Collectors.toList()));
        return map;
    }
}
