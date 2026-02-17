import React, { useState, useRef, useCallback } from 'react';
import { type Post, type Comment, communityService } from '@/services/communityService';
import { formatRelativeTime } from '@/lib/dateUtils';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import ReactMarkdown from 'react-markdown';
import {
    MessageCircle, Share2, MoreHorizontal, Flag, Trash2, Edit2, Heart,
    Bookmark, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


interface PostCardProps {
    post: Post;
    onUpdate: (updatedPost: Post) => void;
    onDelete: (postId: number) => void;
    currentUserId?: number;
    isAdmin?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete, currentUserId, isAdmin }) => {
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const plugin = useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    );

    // Media Carousel
    // const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // REMOVED


    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editCategory] = useState(post.category || '');

    // Report Dialog
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('SPAM');
    const [reportDesc, setReportDesc] = useState('');

    // Reactions
    // Pre-defined reactions + current user's reaction state
    // Reactions

    const handleReaction = async (emoji: string) => {
        try {
            const updated = await communityService.toggleReaction(post.id, emoji);
            onUpdate(updated);
        } catch (error) {
            toast.error('Failed to react');
        }
    };

    const handleBookmark = async () => {
        try {
            const updated = await communityService.toggleBookmark(post.id);
            onUpdate(updated);
            toast.success(updated.bookmarkedByCurrentUser ? 'Post individual bookmarked' : 'Bookmark removed');
        } catch (error) {
            toast.error('Failed to bookmark');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await communityService.deletePost(post.id);
            onDelete(post.id);
            toast.success('Post deleted');
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    const handleEdit = async () => {
        try {
            const updated = await communityService.editPost(post.id, editContent, editCategory);
            onUpdate(updated);
            setIsEditing(false);
            toast.success('Post updated');
        } catch (error) {
            toast.error('Failed to update post');
        }
    };

    const handleReport = async () => {
        try {
            await communityService.reportPost(post.id, reportReason, reportDesc);
            setIsReportOpen(false);
            toast.success('Report submitted');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to report');
        }
    };

    // Comments
    const loadComments = async () => {
        if (!isCommentsOpen) {
            const data = await communityService.getComments(post.id);
            setComments(data);
        }
        setIsCommentsOpen(!isCommentsOpen);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const comment = await communityService.addComment(post.id, newComment, false); // isAnonymous handling to be added
            setComments([comment, ...comments]);
            setNewComment('');
            onUpdate({ ...post, commentsCount: post.commentsCount + 1 });
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleReply = async (commentId: number) => {
        if (!replyContent.trim()) return;
        try {
            const reply = await communityService.addReply(post.id, commentId, replyContent, false);
            // Update local state to show reply
            const updateRepiles = (list: Comment[]): Comment[] => {
                return list.map(c => {
                    if (c.id === commentId) {
                        return { ...c, replies: [...(c.replies || []), reply] };
                    }
                    if (c.replies) {
                        return { ...c, replies: updateRepiles(c.replies) };
                    }
                    return c;
                });
            };
            setComments(updateRepiles(comments));
            setReplyingTo(null);
            setReplyContent('');
            onUpdate({ ...post, commentsCount: post.commentsCount + 1 });
        } catch (error) {
            toast.error('Failed to reply');
        }
    };

    // Carousel Logic
    const hasMedia = post.media && post.media.length > 0;
    // const nextMedia ... REMOVED
    // const prevMedia ... REMOVED

    // Render Comments Recursive
    const renderComments = (list: Comment[], depth = 0) => {
        return list.map(comment => (
            <div key={comment.id} className={cn("flex gap-3 mb-4", depth > 0 && "ml-8 border-l-2 pl-4 border-gray-100 dark:border-gray-800")}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.authorAvatar || undefined} />
                    <AvatarFallback>{comment.authorName?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                            Reply
                        </Button>
                    </div>

                    {replyingTo === comment.id && (
                        <div className="mt-2 flex gap-2">
                            <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="h-8 text-sm"
                            />
                            <Button size="sm" className="h-8" onClick={() => handleReply(comment.id)}>Send</Button>
                        </div>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3">
                            {renderComments(comment.replies, depth + 1)}
                        </div>
                    )}
                </div>
            </div>
        ));
    };

    // Resizable Sheet Logic
    const [sheetWidth, setSheetWidth] = useState(540);
    const isResizingRef = useRef(false);

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        isResizingRef.current = true;
        const startX = mouseDownEvent.clientX;
        const startWidth = sheetWidth;

        const onMouseMove = (mouseMoveEvent: MouseEvent) => {
            if (!isResizingRef.current) return;
            // Calculate new width: original width + (start position - current position)
            // Since it's a right-side sheet, moving left (smaller X) increases width
            const newWidth = startWidth + (startX - mouseMoveEvent.clientX);
            // Limit width between 400px and 90vw
            const constrainedWidth = Math.max(400, Math.min(window.innerWidth * 0.9, newWidth));
            setSheetWidth(constrainedWidth);
        };

        const onMouseUp = () => {
            isResizingRef.current = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = 'ew-resize';
        mouseDownEvent.preventDefault();
        mouseDownEvent.stopPropagation();
    }, [sheetWidth]);

    const isAuthor = currentUserId === post.authorId;
    const canDelete = isAuthor || isAdmin;

    return (
        <Card className="w-full mb-6 overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.authorAvatar || undefined} />
                        <AvatarFallback>{post.authorName?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{post.authorName}</h3>
                            {post.authorRole && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{post.authorRole}</Badge>
                            )}
                            {post.category && (
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">{post.category}</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)} {post.isEdited && <span className="italic">(edited)</span>}</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isAuthor && (
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Post
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleBookmark}>
                            <Bookmark className={cn("mr-2 h-4 w-4", post.bookmarkedByCurrentUser && "fill-current text-primary")} />
                            {post.bookmarkedByCurrentUser ? "Remove Bookmark" : "Bookmark"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-red-600 focus:text-red-600">
                            <Flag className="mr-2 h-4 w-4" /> Report
                        </DropdownMenuItem>
                        {canDelete && (
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                {isEditing ? (
                    <div className="space-y-4">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleEdit}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="prose dark:prose-invert max-w-none text-sm mb-4">
                            <ReactMarkdown components={{
                                p: ({ node, ...props }) => {
                                    return <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                                }
                            }}>
                                {post.content}
                            </ReactMarkdown>
                        </div>

                        {/* Media Carousel */}
                        {hasMedia && (
                            <div className="mb-4">
                                <Carousel
                                    plugins={[plugin.current]}
                                    className="w-full relative group"
                                    onMouseEnter={plugin.current.stop}
                                    onMouseLeave={plugin.current.reset}
                                >
                                    <CarouselContent>
                                        {post.media.map((media) => (
                                            <CarouselItem key={media.id}>
                                                <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 aspect-video flex items-center justify-center">
                                                    {media.mediaType === 'VIDEO' ? (
                                                        <video
                                                            src={media.url}
                                                            controls
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={media.url}
                                                            alt="Post content"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    )}
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {post.media.length > 1 && (
                                        <>
                                            <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </>
                                    )}
                                </Carousel>
                            </div>
                        )}

                        {/* Fallback for legacy single image/video if media array is empty but url exists */}
                        {!hasMedia && (post.imageUrl || post.videoUrl) && (
                            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 mb-4">
                                {post.videoUrl ? (
                                    <video src={post.videoUrl} controls className="w-full max-h-[500px] object-contain" />
                                ) : (
                                    <img src={post.imageUrl} alt="Post content" className="w-full max-h-[500px] object-contain" />
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <CardFooter className="flex flex-col p-4 pt-0">
                <div className="flex items-center justify-between w-full border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "gap-2 text-muted-foreground hover:text-red-500",
                                post.currentUserReactions?.includes('❤️') && "text-red-500 hover:text-red-600"
                            )}
                            onClick={() => handleReaction('❤️')}
                        >
                            <Heart className={cn("h-4 w-4", post.currentUserReactions?.includes('❤️') && "fill-current")} />
                            <span className="text-xs">{post.likesCount} Likes</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary" onClick={loadComments}>
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-xs">{post.commentsCount} Comments</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                className="flex flex-col p-0 bg-background transition-none"
                                style={{ width: `${sheetWidth}px`, maxWidth: '90vw' }}
                            >
                                {/* Resize Handle */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/20 z-50 flex items-center justify-center transition-colors"
                                    onMouseDown={startResizing}
                                    title="Drag to resize"
                                >
                                    <div className="w-0.5 h-8 bg-border rounded-full" />
                                </div>

                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle>Comments</SheetTitle>
                                    <SheetDescription>
                                        Join the conversation.
                                    </SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="flex-1 p-6">
                                    {comments.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>No comments yet. Be the first!</p>
                                        </div>
                                    ) : (
                                        renderComments(comments)
                                    )}
                                </ScrollArea>
                                <div className="p-4 border-t bg-background">
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="resize-none min-h-[80px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                        />
                                        <Button size="icon" className="h-auto" onClick={handleAddComment} disabled={!newComment.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                            <Share2 className="h-4 w-4" />
                            <span className="text-xs">Share</span>
                        </Button>
                    </div>
                </div>

                {/* Legacy inline comments removed */}
            </CardFooter>

            {/* Report Dialog */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Post</DialogTitle>
                        <DialogDescription>
                            Help us keep the community safe. This report will be reviewed by admins.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason</label>
                            <select
                                className="w-full p-2 rounded-md border text-sm bg-transparent"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            >
                                <option value="SPAM">Spam</option>
                                <option value="HARASSMENT">Harassment</option>
                                <option value="INAPPROPRIATE">Inappropriate Content</option>
                                <option value="MISINFORMATION">Misinformation</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <Textarea
                                value={reportDesc}
                                onChange={(e) => setReportDesc(e.target.value)}
                                placeholder="Provide more details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReport}>Submit Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
