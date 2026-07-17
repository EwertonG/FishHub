import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, showToast } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Comment states
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Edit Post states
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const categories = ['Geral', 'Iniciantes', 'Doenças', 'Plantados', 'Equipamentos'];

  const fetchPostDetails = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        throw new Error('Publicação não encontrada.');
      }
      const data = await res.json();
      setPost(data);
      setEditTitle(data.title);
      setEditContent(data.content);
      setEditCategory(data.category);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar tópicos.', 'error');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      showToast('Faça login para curtir publicações.', 'error');
      return;
    }

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao curtir.');
      }
      
      // Update local state
      setPost(prev => ({
        ...prev,
        likesCount: data.likesCount,
        likes: data.liked 
          ? [...(prev.likes || []), user.id]
          : (prev.likes || []).filter(uId => uId !== user.id)
      }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showToast('O comentário não pode ser vazio.', 'error');
      return;
    }

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao comentar.');
      }

      showToast('Comentário publicado.');
      setCommentText('');
      // Update local comment list
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), data]
      }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Excluir este comentário permanentemente?')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao excluir comentário.');
      }

      showToast('Comentário removido.');
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId)
      }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          category: editCategory
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao editar.');
      }

      showToast('Publicação atualizada!');
      setIsEditingPost(false);
      fetchPostDetails(); // Reload content
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Tem certeza de que deseja excluir permanentemente esta publicação do fórum?')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao excluir.');
      }

      showToast('Publicação excluída.');
      navigate('/forum');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>💬</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando publicação...</p>
      </div>
    );
  }

  if (!post) return null;

  const hasLiked = user && post.likes && post.likes.includes(user.id);
  const isAdmin = user && (user.email === 'admin@admin.com' || user.id === '6a583ed9a838f74b25344fcc');
  const isPostAuthor = user && (post.authorId === user.id || isAdmin);

  return (
    <div className="container section post-details-container animate-fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/forum" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          &larr; Voltar ao Fórum
        </Link>
        {isPostAuthor && !isEditingPost && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditingPost(true)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Editar Post
            </button>
            <button onClick={handleDeletePost} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Excluir Post
            </button>
          </div>
        )}
      </div>

      {isEditingPost ? (
        <div className="card" style={{ padding: '30px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '20px' }}>Editar Publicação</h3>
          <form onSubmit={handleEditPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 3 }}>
                <label className="form-label" htmlFor="editTitle">Título</label>
                <input
                  type="text"
                  id="editTitle"
                  className="form-control"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="editCategory">Categoria</label>
                <select
                  id="editCategory"
                  className="form-control"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="editContent">Conteúdo</label>
              <textarea
                id="editContent"
                className="form-control"
                rows="6"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditingPost(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Discussion Thread */
        <article className="post-main">
          <div className="post-card-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div className="post-card-author">
              <span style={{ fontSize: '1.4rem' }}>👤</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{post.authorName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Publicado em {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            <span className="badge" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{post.category}</span>
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>{post.title}</h2>

          <div className="post-details-content">{post.content}</div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button
              onClick={handleLike}
              className={`btn ${hasLiked ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              disabled={likeLoading}
            >
              <span>❤️</span>
              <span>{hasLiked ? 'Curtido' : 'Curtir'} ({post.likesCount || 0})</span>
            </button>
          </div>
        </article>
      )}

      {/* Comments Section */}
      <section className="comments-section">
        <h3 className="comments-title">Comentários ({post.comments?.length || 0})</h3>

        {/* Comment input form */}
        {user ? (
          <form onSubmit={handleAddComment} className="comment-input-card">
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="commentContent">Adicionar Comentário</label>
              <textarea
                id="commentContent"
                className="form-control"
                rows="3"
                placeholder="Compartilhe suas ideias ou responda a esta publicação..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              ></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={commentSubmitting}>
                {commentSubmitting ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Você precisa <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>fazer login</Link> para participar da discussão.
            </p>
          </div>
        )}

        {/* List of comments */}
        {post.comments && post.comments.length > 0 ? (
          post.comments.map(comment => {
            const isCommentAuthor = user && comment.authorId === user.id;
            const canDelete = isCommentAuthor || isPostAuthor || isAdmin;

            return (
              <div key={comment._id} className="comment-card animate-fade-in">
                <div className="comment-header">
                  <span className="comment-author">👤 {comment.authorName}</span>
                  <div className="flex-gap">
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
                <div className="comment-content">{comment.content}</div>
              </div>
            );
          })
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            Nenhum comentário enviado. Escreva o primeiro!
          </p>
        )}
      </section>
    </div>
  );
}
