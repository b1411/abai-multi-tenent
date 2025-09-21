import { useState, useCallback } from 'react';
import { Post, ReactionType, CreatePostData, Comment } from '../types/newsFeed';
import apiClient from '../services/apiClient';
import filesService from "../services/fileService";

const API_URL = '/posts';

export const useNewsFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all posts
  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Post[]>(API_URL);
      setPosts(data);
    } catch {
      setError('Не удалось обновить ленту');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new post
  const createPost = useCallback(async (data: CreatePostData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      let fileIds: number[] = [];
      if (data.files && data.files.length > 0) {
        const uploaded = await filesService.uploadFiles(data.files, 'post');
        fileIds = uploaded.map(f => f.id);
      }
      const formData = new FormData();
      formData.append('content', data.content);
      if (data.visibility) formData.append('visibility', data.visibility);
      data.images?.forEach((file) => formData.append('images', file));
      if (fileIds.length > 0) {
        fileIds.forEach(id => formData.append('fileIds', String(id)));
      }
      await apiClient.post(API_URL, formData);
      await refreshPosts();
    } catch {
      setError('Не удалось создать пост');
      throw new Error('Не удалось создать пост');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  // Add reaction to post
  const addReaction = useCallback(async (postId: string, type: ReactionType) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post(`${API_URL}/${postId}/reactions`, { type });
      await refreshPosts();
    } catch {
      setError('Не удалось добавить реакцию');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  // Remove reaction from post
  const removeReaction = useCallback(async (postId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete(`${API_URL}/${postId}/reactions`);
      await refreshPosts();
    } catch {
      setError('Не удалось удалить реакцию');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  // Add comment to post
  const addComment = useCallback(async (postId: string, content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post(`${API_URL}/${postId}/comments`, { content });
      await refreshPosts();
    } catch {
      setError('Не удалось добавить комментарий');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  // Edit post
  const editPost = useCallback(async (postId: string, data: Partial<Post>) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.put(`${API_URL}/${postId}`, { content: data.content, visibility: data.visibility });
      await refreshPosts();
    } catch {
      setError('Не удалось обновить пост');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete(`${API_URL}/${postId}`);
      await refreshPosts();
    } catch {
      setError('Не удалось удалить пост');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  return {
    posts,
    isLoading,
    error,
    createPost,
    addReaction,
    removeReaction,
    addComment,
    editPost,
    deletePost,
    refreshPosts,
  };
};

export default useNewsFeed;
