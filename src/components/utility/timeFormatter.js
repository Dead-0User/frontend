// Utility to format relative time (e.g., "5 mins ago", "2 hours ago")
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Format absolute time
export const formatAbsoluteTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Format date label (Today, Yesterday, or date)
export const formatDateLabel = (dateString) => {
  if (!dateString) return 'Today';
  
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const orderDate = new Date(date);
  orderDate.setHours(0, 0, 0, 0);
  
  if (orderDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (orderDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  }
};

// Get minutes since timestamp
export const getMinutesSince = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now - date) / 60000);
};