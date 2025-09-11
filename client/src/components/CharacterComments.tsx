import React, { useState, useEffect } from 'react';
import { MessageCircle, Edit2, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@shared/api-types';

interface CharacterCommentsProps {
  characterId: string;
  className?: string;
}

export function CharacterComments({ characterId, className = '' }: CharacterCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [characterId, currentPage]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/characters/${characterId}/comments?page=${currentPage}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentCommentId?: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to comment.",
        variant: "destructive"
      });
      return;
    }

    const content = parentCommentId ? newComment : newComment;
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/characters/${characterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        },
        body: JSON.stringify({
          content: content.trim(),
          parentCommentId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        await fetchComments();
        toast({
          title: "Success",
          description: "Comment posted successfully!"
        });
      } else {
        throw new Error(data.error || 'Failed to post comment');
      }
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to like comments.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComments();
        toast({
          title: "Success",
          description: "Comment deleted successfully."
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingComment(null);
        setEditContent('');
        await fetchComments();
        toast({
          title: "Success",
          description: "Comment updated successfully."
        });
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const CommentItem = ({ comment }: { comment: Comment }) => {
    const isOwner = user?.id === comment.userId._id;
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

    return (
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.userId.avatarUrl} alt={comment.userId.username} />
            <AvatarFallback>{comment.userId.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{comment.userId.username}</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            
            {editingComment === comment._id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] bg-zinc-700/50 border-zinc-600"
                  placeholder="Edit your comment..."
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment._id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-300">{comment.content}</p>
            )}
          </div>
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-11 space-y-3 pt-2 border-l-2 border-zinc-700 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`bg-zinc-800/50 border-orange-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] bg-zinc-700/50 border-zinc-600"
                  placeholder="Share your thoughts about this character..."
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/1000
                  </span>
                  <Button
                    onClick={() => handleSubmitComment()}
                    disabled={submitting || !newComment.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {submitting ? 'Posting...' : (
                      <>
                        <Send className="w-3 h-3 mr-2" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-zinc-400">
            <p>Sign in to leave a comment</p>
          </div>
        )}
        
        {/* Comments list */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p>Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet.</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-400 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 