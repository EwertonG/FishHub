import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Forum() {
  const { user, token, showToast } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const categories = ['Geral', 'Iniciantes', 'Doenças', 'Plantados', 'Equipamentos'];
  const [activeCategory, setActiveCategory] = useState(''); 
  
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef(null);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async (searchVal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (activeCategory) params.append('category', activeCategory);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(search);
  }, [activeCategory]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPosts(val);
    }, 350);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast('Por favor, preencha o título e o conteúdo.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao criar publicação.');
      }

      showToast('Discussão criada com sucesso!');
      setNewTitle('');
      setNewContent('');
      setNewCategory('Geral');
      setShowNewPostForm(false);
      
      fetchPosts(search);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section animate-fade-in">
      <header className="hero" style={{ padding: '24px 0', marginBottom: '24px' }}>
        <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2.2rem', color: 'var(--accent)' }}>💬 Fórum de Discussões</h1>
        <p style={{ marginTop: '6px', fontSize: '0.95rem' }}>Central de Ajuda e Integração da Comunidade de Aquaristas</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        {user ? (
          <button
            onClick={() => setShowNewPostForm(prev => !prev)}
            className="btn btn-primary"
          >
            {showNewPostForm ? 'Fechar Formulário' : 'Nova Discussão'}
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Entre para Iniciar Discussão
          </Link>
        )}
      </div>

      
      {showNewPostForm && user && (
        <div className="tank-frame animate-fade-in" style={{ marginBottom: '24px' }}>
          <div className="tank-header">
            <span>Iniciar Novo Tópico de Discussão</span>
          </div>
          <div className="tank-body">
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 3 }}>
                  <label className="form-label" htmlFor="postTitle">Título do Tópico</label>
                  <input
                    type="text"
                    id="postTitle"
                    className="form-control"
                    placeholder="Escreva um título claro e descritivo..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="postCategory">Categoria</label>
                  <select
                    id="postCategory"
                    className="form-control"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="postContent">Mensagem Principal</label>
                <textarea
                  id="postContent"
                  className="form-control"
                  rows="5"
                  placeholder="Forneça detalhes do seu problema ou experiência..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewPostForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publicando...' : 'Publicar Tópico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      <div className="forum-layout">
        
        <aside>
          <div style={{ position: 'sticky', top: '96px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'left', paddingLeft: '8px' }}>
              Navegar por Categoria
            </h3>
            <ul className="forum-nav" style={{ border: '3px double var(--tank-rim)' }}>
              <li>
                <button
                  onClick={() => setActiveCategory('')}
                  className={`forum-nav-btn ${activeCategory === '' ? 'active' : ''}`}
                >
                  🌐 Todas as Categorias
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`forum-nav-btn ${activeCategory === cat ? 'active' : ''}`}
                  >
                    🏷️ {cat}
                  </button>
                </li>
              ))}
            </ul>

            
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <label className="filter-section-title" style={{ display: 'block', marginBottom: '8px' }}>Pesquisa Rápida</label>
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar palavras-chave..."
                  className="form-control search-input"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </aside>

        
        <main className="tank-frame">
          <div className="tank-header">
            <span>💬 Discussões em Andamento</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Visualização clássica do fórum</span>
          </div>

          {loading ? (
            <div className="tank-body">
              <p className="text-center" style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Consultando banco de dados...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="tank-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '2.5rem' }}>💬</span>
              <h3 style={{ fontSize: '1.3rem', marginTop: '12px' }}>Nenhum Tópico Iniciado</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                Ainda não há postagens nesta categoria. Comece uma nova discussão!
              </p>
            </div>
          ) : (
            <div>
              
              <div className="forum-table-header">
                <span>Tópico</span>
                <span style={{ textAlign: 'center' }}>Curtidas / Comentários</span>
                <span style={{ textAlign: 'right' }}>Categoria</span>
              </div>
              
              
              <div className="forum-rows-container">
                {posts.map(post => (
                  <div key={post._id} className="forum-row-item">
                    <div className="forum-row-title-col">
                      <Link to={`/posts/${post._id}`} className="forum-row-title-text">
                        {post.title}
                      </Link>
                      <span className="forum-row-author-info">
                        por {post.authorName} em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="forum-row-stat-col" style={{ textAlign: 'center', alignItems: 'center' }}>
                      <span>❤️ {post.likesCount || 0} curtidas</span>
                      <span>💬 {post.comments?.length || 0} respostas</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge">{post.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
