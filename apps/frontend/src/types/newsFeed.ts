export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';

export interface User {
  id: string;
  name: string;
  surname?: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface PostImage {
  id: string;
  imageUrl: string;
  fileName: string;
}

export interface PostFile {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  user: User;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  images: PostImage[];
  files: PostFile[];
  reactions: Reaction[];
  comments: Comment[];
  _count: {
    reactions: number;
    comments: number;
  };
}

export interface CreatePostData {
  content: string;
  images?: File[];
  files?: File[];
}

export interface CreateCommentData {
  content: string;
  postId: string;
}

export interface ReactionData {
  postId: string;
  type: ReactionType;
}

export interface NewsFeedResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
