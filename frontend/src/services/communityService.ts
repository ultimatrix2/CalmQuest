import axios from 'axios';

const API_URL = 'http://localhost:8080/api/community';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface User {
    id: number;
    fullName: string;
    profilePicture?: string;
}

export interface MediaItem {
    id: number;
    url: string;
    mediaType: 'IMAGE' | 'VIDEO';
    displayOrder: number;
}

export interface Post {
    id: number;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    isAnonymous: boolean;
    isPinned: boolean;
    isEdited: boolean;
    likesCount: number;
    commentsCount: number;
    hashtags: string[];
    category?: string;
    createdAt: string;
    updatedAt?: string;
    authorId?: number;
    authorName?: string;
    authorAvatar?: string;
    authorRole?: string;
    likedByCurrentUser: boolean;
    bookmarkedByCurrentUser: boolean;
    reactions: Record<string, number>;
    currentUserReactions: string[];
    media: MediaItem[];
}

export interface Comment {
    id: number;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    authorName?: string;
    authorAvatar?: string;
    parentCommentId?: number;
    replies?: Comment[];
}

export const communityService = {
    getFeed: async (page = 0, size = 10, sort = 'recent', search = '', category?: string) => {
        const response = await axios.get(`${API_URL}/posts`, {
            params: { page, size, sort, search, category },
            ...getAuthHeader()
        });
        return response.data;
    },

    getPost: async (id: number) => {
        const response = await axios.get(`${API_URL}/posts/${id}`, getAuthHeader());
        return response.data;
    },

    createPost: async (formData: FormData) => {
        const response = await axios.post(`${API_URL}/posts`, formData, {
            headers: {
                ...getAuthHeader().headers,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    editPost: async (id: number, content: string, category?: string) => {
        const response = await axios.put(`${API_URL}/posts/${id}`, { content, category }, getAuthHeader());
        return response.data;
    },

    deletePost: async (id: number) => {
        const response = await axios.delete(`${API_URL}/posts/${id}`, getAuthHeader());
        return response.data;
    },

    toggleReaction: async (id: number, emoji: string) => {
        const response = await axios.post(`${API_URL}/posts/${id}/react`, { emoji }, getAuthHeader());
        return response.data;
    },

    reportPost: async (id: number, reason: string, description: string) => {
        const response = await axios.post(`${API_URL}/posts/${id}/report`, { reason, description }, getAuthHeader());
        return response.data;
    },

    toggleBookmark: async (id: number) => {
        const response = await axios.post(`${API_URL}/posts/${id}/bookmark`, {}, getAuthHeader());
        return response.data;
    },

    getBookmarks: async (page = 0, size = 10) => {
        const response = await axios.get(`${API_URL}/posts/bookmarks`, {
            params: { page, size },
            ...getAuthHeader()
        });
        return response.data;
    },

    addComment: async (postId: number, content: string, isAnonymous: boolean) => {
        const response = await axios.post(`${API_URL}/posts/${postId}/comments`, { content, isAnonymous }, getAuthHeader());
        return response.data;
    },

    addReply: async (postId: number, commentId: number, content: string, isAnonymous: boolean) => {
        const response = await axios.post(`${API_URL}/posts/${postId}/comments/${commentId}/reply`, { content, isAnonymous }, getAuthHeader());
        return response.data;
    },

    getComments: async (postId: number) => {
        const response = await axios.get(`${API_URL}/posts/${postId}/comments`, getAuthHeader());
        return response.data;
    },

    togglePin: async (id: number) => {
        const response = await axios.post(`${API_URL}/posts/${id}/pin`, {}, getAuthHeader());
        return response.data;
    },

    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
        return response.data;
    },

    getTrendingTags: async () => {
        const response = await axios.get(`${API_URL}/tags/trending`, getAuthHeader());
        return response.data;
    },

    searchUsers: async (query: string) => {
        const response = await axios.get(`${API_URL}/users/search`, {
            params: { q: query },
            ...getAuthHeader()
        });
        return response.data;
    }
};
