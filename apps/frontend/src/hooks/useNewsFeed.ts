import { useState, useCallback } from 'react';
import { Post, ReactionType, CreatePostData, Comment } from '../types/newsFeed';
import { mockPosts } from '../data/mockNewsFeedData';

export const useNewsFeed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new post
  const createPost = useCallback(async (data: CreatePostData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost: Post = {
        id: Date.now().toString(),
        content: data.content,
        author: {
          id: '1', // Mock current user
          name: 'Вы',
          surname: '',
          email: 'you@abai.edu.kz',
          role: 'USER',
          avatar: ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: data.images?.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          imageUrl: URL.createObjectURL(file),
          fileName: file.name
        })) || [],
        files: data.files?.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown'
        })) || [],
        reactions: [],
        comments: [],
        _count: {
          reactions: 0,
          comments: 0
        }
      };

      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError('Не удалось создать пост');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add reaction to post
  const addReaction = useCallback((postId: string, type: ReactionType) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;

      const existingReactionIndex = post.reactions.findIndex(r => r.userId === '1');
      let newReactions = [...post.reactions];

      if (existingReactionIndex >= 0) {
        // Update existing reaction
        newReactions[existingReactionIndex] = {
          ...newReactions[existingReactionIndex],
          type
        };
      } else {
        // Add new reaction
        newReactions.push({
          id: Date.now().toString(),
          type,
          userId: '1',
          user: {
            id: '1',
            name: 'Вы',
            surname: '',
            email: 'you@abai.edu.kz',
            role: 'USER',
            avatar: ''
          }
        });
      }

      return {
        ...post,
        reactions: newReactions,
        _count: {
          ...post._count,
          reactions: newReactions.length
        }
      };
    }));
  }, []);

  // Remove reaction from post
  const removeReaction = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;

      const newReactions = post.reactions.filter(r => r.userId !== '1');

      return {
        ...post,
        reactions: newReactions,
        _count: {
          ...post._count,
          reactions: newReactions.length
        }
      };
    }));
  }, []);

  // Add comment to post
  const addComment = useCallback((postId: string, content: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;

      const newComment: Comment = {
        id: Date.now().toString(),
        content,
        author: {
          id: '1',
          name: 'Вы',
          surname: '',
          email: 'you@abai.edu.kz',
          role: 'USER',
          avatar: ''
        },
        createdAt: new Date().toISOString()
      };

      const newComments = [...post.comments, newComment];

      return {
        ...post,
        comments: newComments,
        _count: {
          ...post._count,
          comments: newComments.length
        }
      };
    }));
  }, []);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPosts(mockPosts);
    } catch (err) {
      setError('Не удалось обновить ленту');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    posts,
    isLoading,
    error,
    createPost,
    addReaction,
    removeReaction,
    addComment,
    refreshPosts
  };
};

export default useNewsFeed;
