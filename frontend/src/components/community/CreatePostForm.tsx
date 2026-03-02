import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { communityService } from '@/services/communityService';
import { toast } from 'sonner';

interface CreatePostFormProps {
    onPostCreated: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<string>('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mention Logic
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<{ id: number; fullName: string; profilePicture?: string }[]>([]);
    const [mentionIndex, setMentionIndex] = useState<number>(-1);
    const [showMentions, setShowMentions] = useState(false);

    const categories = [
        "General", "Question", "Discussion", "Tip", "Support", "Event", "Showcase"
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + mediaFiles.length > 5) {
                toast.error("You can upload a maximum of 5 files.");
                return;
            }

            setMediaFiles(prev => [...prev, ...files]);

            // Generate previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            // Revoke old url to free memory
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };

    const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1) {
            const query = textBeforeCursor.substring(lastAt + 1);

            // Limit query length to avoid searching for whole sentences
            if (query.length < 30 && !query.includes('\n')) {
                setMentionIndex(lastAt);
                setMentionQuery(query);
                setShowMentions(true);

                try {
                    if (query.length > 0) {
                        const results = await communityService.searchUsers(query);
                        setMentionResults(results);
                    } else {
                        setMentionResults([]);
                    }
                } catch (err) {
                    console.error(err);
                }
            } else {
                setShowMentions(false);
                setMentionQuery(null);
            }
        } else {
            setShowMentions(false);
            setMentionQuery(null);
        }
    };

    const handleSelectUser = (user: { fullName: string }) => {
        if (mentionIndex === -1) return;

        // Replace @query with @User_Name
        const nameToInsert = user.fullName.replace(/\s+/g, '_');
        const before = content.substring(0, mentionIndex);
        // Look for next space or end of string to define where the query ends
        // But since we rely on cursor pos during typing, we can just replace the query part.
        // Or assume the query is exactly what we used to search.
        const queryLen = mentionQuery ? mentionQuery.length : 0;
        const after = content.substring(mentionIndex + 1 + queryLen);

        const newContent = `${before}@${nameToInsert} ${after}`;

        setContent(newContent);
        setShowMentions(false);
        setMentionQuery(null);
        setMentionResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && mediaFiles.length === 0) {
            toast.error("Post content or media is required.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('content', content);
        if (category) formData.append('category', category);
        formData.append('isAnonymous', isAnonymous.toString());

        mediaFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            await communityService.createPost(formData);
            toast.success("Post created successfully!");
            setContent('');
            setCategory('');
            setIsAnonymous(false);
            setMediaFiles([]);
            setPreviews([]);
            onPostCreated();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-6 relative">
            {/* Mention Suggestions Popover */}
            {showMentions && mentionResults.length > 0 && (
                <div className="absolute z-50 left-4 top-[100px] w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {mentionResults.map(user => (
                        <button
                            key={user.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                            onClick={() => handleSelectUser(user)}
                        >
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.fullName} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="flex items-center justify-center h-full text-[10px] font-bold">
                                        {user.fullName.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <span>{user.fullName}</span>
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                        <Textarea
                            placeholder="What's on your mind? Use #hashtags and @mentions..."
                            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base p-0 shadow-none"
                            value={content}
                            onChange={handleContentChange}
                        />

                        {/* Media Previews */}
                        {previews.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border">
                                        <img src={src} alt="preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Media</span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                />

                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-8 w-[130px] border-dashed text-xs">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="anonymous-mode"
                                        checked={isAnonymous}
                                        onCheckedChange={setIsAnonymous}
                                    />
                                    <Label htmlFor="anonymous-mode" className="text-xs cursor-pointer text-muted-foreground">Anonymous</Label>
                                </div>
                                <Button type="submit" disabled={isSubmitting || (!content && mediaFiles.length === 0)} size="sm">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        'Post'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
