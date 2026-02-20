package com.calmquest.controller;

import com.calmquest.dto.CommunityPostDTO;
import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final UserRepository userRepository;

    // ─── Feed ───────────────────────────────────────────────

    @GetMapping("/posts")
    public ResponseEntity<Page<CommunityPostDTO>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getFeed(user, PageRequest.of(page, size), sort, search, category));
    }

    // ─── Get Single Post ────────────────────────────────────

    @GetMapping("/posts/{id}")
    public ResponseEntity<CommunityPostDTO> getPost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getPost(id, user));
    }

    // ─── Create Post ────────────────────────────────────────

    @PostMapping("/posts")
    public ResponseEntity<CommunityPostDTO> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("content") String content,
            @RequestParam(value = "hashtags", required = false) String hashtags,
            @RequestParam(value = "isAnonymous", defaultValue = "false") Boolean isAnonymous,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        User user = getUser(userDetails);

        List<String> tagList = null;
        if (hashtags != null && !hashtags.isBlank()) {
            tagList = Arrays.stream(hashtags.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        CommunityPostDTO created = communityService.createPost(user, content, tagList, isAnonymous, category, files);
        return ResponseEntity.ok(created);
    }

    // ─── Edit Post ──────────────────────────────────────────

    @PutMapping("/posts/{id}")
    public ResponseEntity<CommunityPostDTO> editPost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.editPost(id, user, body.get("content"), body.get("category")));
    }

    // ─── Delete Post ────────────────────────────────────────

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        communityService.deletePost(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Post deleted"));
    }

    // ─── Reactions ──────────────────────────────────────────

    @PostMapping("/posts/{id}/react")
    public ResponseEntity<CommunityPostDTO> toggleReaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.toggleReaction(id, user, body.get("emoji")));
    }

    // ─── Legacy Like (backward compat) ──────────────────────

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<CommunityPostDTO> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.toggleLike(id, user));
    }

    // ─── Report ─────────────────────────────────────────────

    @PostMapping("/posts/{id}/report")
    public ResponseEntity<?> reportPost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.reportPost(id, user, body.get("reason"), body.get("description")));
    }

    // ─── Bookmark ───────────────────────────────────────────

    @PostMapping("/posts/{id}/bookmark")
    public ResponseEntity<CommunityPostDTO> toggleBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.toggleBookmark(id, user));
    }

    @GetMapping("/posts/bookmarks")
    public ResponseEntity<Page<CommunityPostDTO>> getUserBookmarks(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getUserBookmarks(user, PageRequest.of(page, size)));
    }

    // ─── Comments ───────────────────────────────────────────

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = getUser(userDetails);
        String content = (String) body.get("content");
        Boolean isAnonymous = body.get("isAnonymous") != null ? (Boolean) body.get("isAnonymous") : false;

        return ResponseEntity.ok(communityService.addComment(id, user, content, isAnonymous));
    }

    @PostMapping("/posts/{id}/comments/{commentId}/reply")
    public ResponseEntity<?> addReply(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = getUser(userDetails);
        String content = (String) body.get("content");
        Boolean isAnonymous = body.get("isAnonymous") != null ? (Boolean) body.get("isAnonymous") : false;

        return ResponseEntity.ok(communityService.addReply(id, commentId, user, content, isAnonymous));
    }

    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getThreadedComments(id, user));
    }

    // ─── Pin / Unpin ────────────────────────────────────────

    @PostMapping("/posts/{id}/pin")
    public ResponseEntity<CommunityPostDTO> togglePin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.togglePin(id, user));
    }

    // ─── Stats & Tags ───────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getStats(user));
    }

    @GetMapping("/tags/trending")
    public ResponseEntity<?> getTrendingTags(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.getTrendingTags(user));
    }

    // ─── User search (for @mentions) ────────────────────────

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(@RequestParam String q, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(communityService.searchUsers(q, user));
    }

    // ─── Helper ─────────────────────────────────────────────

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
