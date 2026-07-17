import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { toggleFavorite, user } = useAuth();
  const [mostViewedFishes, setMostViewedFishes] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loadingFishes, setLoadingFishes] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    async function fetchFishes() {
      try {
        const res = await fetch('/api/fishes?sortBy=views');
        if (res.ok) {
          const data = await res.json();
          setMostViewedFishes(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching popular fishes:', err);
      } finally {
        setLoadingFishes(false);
      }
    }

    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setRecentPosts(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    }

    fetchFishes();
    fetchPosts();
  }, []);

  return (
    <div className="container animate-fade-in">
      <header className="hero">
        <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2.5rem', color: 'var(--accent)' }}>🐠 FishHub</h1>
        <p style={{ marginTop: '8px' }}>
          Sistema de Controle, Catalogação e Fórum de Discussões sobre Aquarismo
        </p>
      </header>

      {/* Popular Fishes Section (Tank Frame style) */}
      <section className="section">
        <div className="tank-frame">
          <div className="tank-header">
            <span>🐟 Espécies Mais Visualizadas</span>
            <Link to="/catalog" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              Ver Catálogo Completo
            </Link>
          </div>
          <div className="tank-body">
            {loadingFishes ? (
              <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Consultando banco de dados...</p>
            ) : mostViewedFishes.length === 0 ? (
              <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Nenhum peixe catalogado no sistema.</p>
            ) : (
              <div className="fish-grid">
                {mostViewedFishes.map(fish => {
                  const isFav = user?.favorites?.includes(fish._id);
                  return (
                    <article key={fish._id} className="fish-card">
                      <div className="fish-card-img-wrapper">
                        <img src={fish.imageUrl} alt={fish.commonName} className="fish-card-img" />
                        <span className="fish-card-badge">{fish.category}</span>
                        <button
                          className={`fish-card-favorite-btn ${isFav ? 'active' : ''}`}
                          onClick={() => toggleFavorite(fish._id)}
                          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </button>
                      </div>
                      <div className="fish-card-content">
                        <h3 className="fish-card-name">{fish.commonName}</h3>
                        <p className="fish-card-scientific">{fish.scientificName}</p>
                        <p className="fish-card-desc">{fish.description}</p>
                        <div className="fish-card-footer">
                          <div>🌡️ {fish.tempMin}°C - {fish.tempMax}°C</div>
                          <div>🧪 pH {fish.phMin} - {fish.phMax}</div>
                          <div>👁️ {fish.views || 0}</div>
                        </div>
                        <Link to={`/fishes/${fish._id}`} className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                          Ficha Técnica
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Forum Posts Section (phpBB table layout style) */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="tank-frame">
          <div className="tank-header">
            <span>💬 Últimas Discussões do Fórum</span>
            <Link to="/forum" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              Ir para o Fórum
            </Link>
          </div>
          
          {loadingPosts ? (
            <div className="tank-body">
              <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Carregando postagens...</p>
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="tank-body">
              <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Nenhuma publicação iniciada no fórum.</p>
            </div>
          ) : (
            <div>
              {/* Classic table header */}
              <div className="forum-table-header">
                <span>Tópico</span>
                <span style={{ textAlign: 'center' }}>Curtidas / Comentários</span>
                <span style={{ textAlign: 'right' }}>Categoria</span>
              </div>
              
              {/* Table rows */}
              <div className="forum-rows-container">
                {recentPosts.map(post => (
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
        </div>
      </section>
    </div>
  );
}
