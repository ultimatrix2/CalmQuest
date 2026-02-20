import React, { useEffect, useState, useCallback } from 'react';
import { communityService, type Post } from '@/services/communityService';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export const CommunityPage: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    // Page is 0-indexed for backend, but UI is 1-indexed
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sort, setSort] = useState('recent');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const debouncedSearch = useDebounce(search, 500);

    const isApproved = user?.communityStatus === 'APPROVED' || user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN';

    const loadPosts = useCallback(async () => {
        if (!isApproved) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await communityService.getFeed(page, 10, sort, debouncedSearch, category === 'All' ? undefined : category);
            setPosts(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [page, sort, debouncedSearch, category, isApproved]);

    // Initial load and when dependencies change
    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Reset to page 1 when sort, search, or category changes
    useEffect(() => {
        setPage(0);
    }, [sort, debouncedSearch, category]);

    const handlePostCreated = () => {
        loadPosts();
    };

    const handlePostUpdate = (updatedPost: Post) => {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const handlePostDelete = (postId: number) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        loadPosts(); // Reload to fill the gap if needed
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

                {/* Main Feed Column */}
                <div className="flex flex-col gap-6">
                    {/* Header / Search / Sort */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-2">
                        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-48">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Category Filter */}
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="Support">Support</SelectItem>
                                    <SelectItem value="Tip">Tip</SelectItem>
                                    <SelectItem value="Event">Event</SelectItem>
                                    <SelectItem value="Question">Question</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Newest</SelectItem>
                                    <SelectItem value="oldest">Oldest</SelectItem>
                                    <SelectItem value="most_liked">Top Liked</SelectItem>
                                    <SelectItem value="most_commented">Discussed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Create Post Form */}
                    {isApproved && <CreatePostForm onPostCreated={handlePostCreated} />}

                    {/* Posts List */}
                    <div className="space-y-6">
                        {!isApproved ? (
                            <div className="text-center py-16 px-4 border border-dashed rounded-xl bg-muted/10">
                                <h3 className="text-xl font-semibold mb-3">Verification Pending</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Your account is currently waiting for verification by your College Admin.
                                    You will be able to view and post in the community once your account is approved.
                                </p>
                            </div>
                        ) : loading && posts.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {posts.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                                        <p>No posts found matching your criteria.</p>
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onUpdate={handlePostUpdate}
                                            onDelete={handlePostDelete}
                                            currentUserId={user?.id}
                                            // @ts-ignore - role might be string or enum
                                            isAdmin={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN'}
                                        />
                                    ))
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Pagination className="mt-8">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                                                    className={page === 0 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {/* Logic to show limited page numbers */}
                                            {[...Array(totalPages)].map((_, i) => {
                                                // Show first, last, current, and adjacent pages
                                                if (
                                                    i === 0 ||
                                                    i === totalPages - 1 ||
                                                    (i >= page - 1 && i <= page + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                href="#"
                                                                isActive={page === i}
                                                                onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                                                            >
                                                                {i + 1}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                }
                                                // Ellipsis logic could be added here for large number of pages
                                                return null;
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                                                    className={page === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Sticky */}
                <div className="hidden lg:block space-y-6">
                    <div className="sticky top-6 space-y-6 h-fit">
                        <CommunitySidebar onTagClick={(tag) => setSearch(tag)} />

                        {/* Footer / Links */}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground px-2">
                            <span>Privacy</span> &middot;
                            <span>Terms</span> &middot;
                            <span>Guidelines</span> &middot;
                            <span>CalmQuest © 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
