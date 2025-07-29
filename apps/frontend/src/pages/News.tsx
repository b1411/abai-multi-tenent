import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  mediaUrl?: string;
  likes: number;
  comments: CommentItem[];
}

interface CommentItem {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeNewsId, setActiveNewsId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/news");
      setNews(res.data);
    } catch {
      setNews([]);
    }
    setLoading(false);
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let mediaUrl = "";
    if (media) {
      const formData = new FormData();
      formData.append("file", media);
      const uploadRes = await axios.post("/api/news/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      mediaUrl = uploadRes.data.url;
    }
    await axios.post("/api/news", { title, content, mediaUrl });
    setTitle("");
    setContent("");
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetchNews();
    setSubmitting(false);
  };

  const handleLike = async (id: number) => {
    await axios.post(`/api/news/${id}/like`);
    await fetchNews();
  };

  const handleComment = async (newsId: number) => {
    if (!commentText.trim()) return;
    await axios.post(`/api/news/${newsId}/comments`, { text: commentText });
    setCommentText("");
    await fetchNews();
    setActiveNewsId(newsId);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-2 text-red-500 font-bold">DEBUG: News page rendered</div>
      <h1 className="text-2xl font-bold mb-4">Новости</h1>
      <form onSubmit={handleCreateNews} className="mb-6 bg-white rounded shadow p-4">
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <textarea
          placeholder="Текст новости"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          rows={3}
          required
        />
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={(e) => setMedia(e.target.files?.[0] || null)}
          className="mb-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          {submitting ? "Создание..." : "Создать новость"}
        </button>
      </form>
      {loading ? (
        <div>Загрузка...</div>
      ) : news.length === 0 ? (
        <div>Нет новостей</div>
      ) : (
        <ul className="space-y-4">
          {news.map((item) => (
            <li key={item.id} className="bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-gray-700">{item.content}</p>
              {item.mediaUrl && (
                item.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={item.mediaUrl} controls className="mt-2 max-w-full rounded" />
                ) : (
                  <img src={item.mediaUrl} alt="media" className="mt-2 max-w-full rounded" />
                )
              )}
              <div className="mt-2 text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => handleLike(item.id)}
                  className="text-blue-500 hover:underline"
                >
                  👍 {item.likes}
                </button>
                <button
                  onClick={() => setActiveNewsId(item.id)}
                  className="text-gray-500 hover:underline"
                >
                  Комментарии ({item.comments.length})
                </button>
              </div>
              {activeNewsId === item.id && (
                <div className="mt-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleComment(item.id);
                    }}
                    className="flex gap-2 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Ваш комментарий"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 py-2 rounded"
                    >
                      Отправить
                    </button>
                  </form>
                  <ul className="space-y-2">
                    {item.comments.map((c) => (
                      <li key={c.id} className="border-b pb-2">
                        <span className="font-semibold">{c.author}</span>: {c.text}
                        <div className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default News;
