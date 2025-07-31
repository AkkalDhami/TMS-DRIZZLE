export function formattedDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function statusBadage(status) {
    const option = {
        pending: 'bg-amber-500/10 text-amber-600',
        'in progress': 'bg-blue-500/10 text-blue-600',
        completed: 'bg-green-500/10 text-green-600',
        none: "bg-zinc-500/10 text-dark",
        daily: "bg-green-500/10 text-green-600",
        monthly: "bg-orange-500/10 text-orange-600",
        weekly: "bg-indigo-500/10 text-indigo-600",
        yearly: "bg-pink-500/10 text-pink-600",
    }

    return `<span class="capitalize font-medium text-[13px] px-3 py-1.5 rounded-full ${option[status]}">${status}</span>`
}

export function getPriorityColor(priority) {
    const option = {
        low: 'bg-orange-500/10 text-orange-600',
        medium: 'bg-green-500/10 text-green-600',
        high: 'bg-red-500/10 text-red-600',
    }
    return `<span class="capitalize font-medium text-[13px] px-3 py-1.5 rounded-full ${option[priority]}">${priority} Priority</span>`
}

export function formatTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000); // in seconds

    if (diff < 60) return `${diff} second${diff === 1 ? '' : 's'} ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}