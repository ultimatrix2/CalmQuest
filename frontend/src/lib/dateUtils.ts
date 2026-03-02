import { formatDistanceToNowStrict } from 'date-fns';

export const formatRelativeTime = (dateString: string | Date): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than 1 minute -> "1 min ago"
    if (diffInSeconds < 60) {
        return "1 min ago";
    }

    const minutes = Math.floor(diffInSeconds / 60);
    // Less than 1 hour -> "X min ago"
    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);
    // Less than 24 hours -> "X hour ago"
    if (hours < 24) {
        return `${hours} hour ago`;
    }

    // Fallback to standard "2 days ago", "1 month ago" etc.
    return formatDistanceToNowStrict(date, { addSuffix: true });
};
