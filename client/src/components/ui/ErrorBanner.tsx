import React from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Users, 
  MessageCircle, 
  Heart, 
  Wifi, 
  RefreshCw,
  Search,
  UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  type: 'characterNotFound' | 'creatorNotFound' | 'noCharacters' | 'noCreators' | 'noChats' | 'noFollowing' | 'networkError' | 'unknownError';
  className?: string;
  onRetry?: () => void;
}

const errorConfig = {
  characterNotFound: {
    icon: Search,
    title: "Character Not Found",
    message: "The character you're looking for doesn't exist.",
    variant: "warning" as const,
    actionText: "Browse Characters",
    actionHref: "/ForYouPage",
    showRetry: false,
    showRefresh: false
  },
  creatorNotFound: {
    icon: UserX,
    title: "Creator Not Found", 
    message: "The creator you're looking for doesn't exist.",
    variant: "warning" as const,
    actionText: "Explore Creators",
    actionHref: "/creators",
    showRetry: false,
    showRefresh: false
  },
  noCharacters: {
    icon: Users,
    title: "No Characters Found",
    message: "No characters found matching your criteria.",
    variant: "info" as const,
    actionText: "View All Characters",
    actionHref: "/ForYouPage",
    showRetry: false,
    showRefresh: false
  },
  noCreators: {
    icon: Users,
    title: "No Creators Found",
    message: "No creators found matching your criteria.",
    variant: "info" as const,
    actionText: "Browse All Creators", 
    actionHref: "/creators",
    showRetry: false,
    showRefresh: false
  },
  noChats: {
    icon: MessageCircle,
    title: "No Conversations Yet",
    message: "You haven't started any conversations yet.",
    variant: "info" as const,
    actionText: "Find Characters",
    actionHref: "/ForYouPage",
    showRetry: false,
    showRefresh: false
  },
  noFollowing: {
    icon: Heart,
    title: "Not Following Anyone",
    message: "You're not following any creators yet.",
    variant: "info" as const,
    actionText: "Discover Creators",
    actionHref: "/creators",
    showRetry: false,
    showRefresh: false
  },
  networkError: {
    icon: Wifi,
    title: "Connection Problem",
    message: "Unable to connect to the server. Please check your internet connection.",
    variant: "error" as const,
    actionText: "Retry",
    actionHref: undefined,
    showRetry: true,
    showRefresh: false
  },
  unknownError: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    message: "Something went wrong. Please refresh the page.",
    variant: "error" as const,
    actionText: "Refresh Page",
    actionHref: undefined,
    showRetry: false,
    showRefresh: true
  }
};

const variantStyles = {
  error: {
    container: "bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 shadow-red-500/10",
    icon: "text-red-400 bg-red-500/20",
    title: "text-red-300",
    message: "text-red-200/80",
    button: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
  },
  warning: {
    container: "bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 shadow-amber-500/10",
    icon: "text-amber-400 bg-amber-500/20", 
    title: "text-amber-300",
    message: "text-amber-200/80",
    button: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
  },
  info: {
    container: "bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-orange-500/20 shadow-orange-500/10",
    icon: "text-orange-400 bg-orange-500/20",
    title: "text-orange-300", 
    message: "text-zinc-300",
    button: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
  }
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ 
  type, 
  className, 
  onRetry 
}) => {
  const config = errorConfig[type];
  const styles = variantStyles[config.variant];
  const Icon = config.icon;

  const handleAction = () => {
    if (config.showRetry && onRetry) {
      onRetry();
    } else if (config.showRefresh) {
      window.location.reload();
    } else if (config.actionHref) {
      window.location.href = config.actionHref;
    }
  };

  return (
    <div className={cn(
      "backdrop-blur-lg border rounded-2xl p-6 shadow-2xl",
      styles.container,
      className
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
          styles.icon
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-lg font-semibold mb-2", styles.title)}>
            {config.title}
          </h3>
          <p className={cn("text-sm leading-relaxed mb-4", styles.message)}>
            {config.message}
          </p>
          
          {/* Action Button */}
          <button
            onClick={handleAction}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-white",
              styles.button
            )}
          >
            {config.showRetry && <RefreshCw className="w-4 h-4" />}
            {config.showRefresh && <RefreshCw className="w-4 h-4" />}
            {config.actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact inline error message component
interface InlineErrorProps {
  message: string;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ 
  message, 
  variant = 'error', 
  className 
}) => {
  const styles = variantStyles[variant];
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm",
      styles.container,
      className
    )}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", styles.icon)}>
        {variant === 'error' && <XCircle className="w-4 h-4" />}
        {variant === 'warning' && <AlertTriangle className="w-4 h-4" />}
        {variant === 'info' && <AlertTriangle className="w-4 h-4" />}
      </div>
      <p className={cn("text-sm", styles.message)}>{message}</p>
    </div>
  );
};

export default ErrorBanner;
