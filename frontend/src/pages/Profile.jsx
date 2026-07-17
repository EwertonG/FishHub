import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token, updateProfile, toggleFavorite, showToast } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('favorites'); // favorites, posts, settings

  // Profile Stats & Data states
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Settings Edit states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching profile statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!token) {
      showToast('Por favor, faça login para ver seu perfil.', 'error');
      navigate('/login');
      return;
    }

    if (user) {
      setName(user.name);
      setEmail(user.email);
      fetchStats();
    }
  }, [user, token, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Nome e e-mail são obrigatórios.', 'error');
      return;
    }

    if (password && password !== confirmPassword) {
      showToast('As novas senhas não coincidem.', 'error');
      return;
    }

    setUpdating(true);
    try {
      await updateProfile(name, email, password);
      setPassword('');
      setConfirmPassword('');
      // Refetch stats to keep everything synced
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar alterações.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveFavorite = async (fishId) => {
    const isRemoved = await toggleFavorite(fishId);
    // Sync local stats array
    if (stats) {
      setStats(prev => ({
        ...prev,
        favorites: prev.favorites.filter(fish => fish._id !== fishId)
      }));
    }
  };

  if (!user || loadingStats) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>👤</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando dados do perfil...</p>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <div className="section-title-wrapper" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem' }}>Meu Perfil</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie sua conta, visualize peixes favoritados e acompanhe suas discussões.
          </p>
        </div>
      </div>

      {/* Profile Header Summary */}
      <div className="profile-header-card">
        <div className="profile-avatar-info">
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user.email}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              Membro desde: {new Date(user.createdAt || new Date()).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="profile-stats-summary">
          <div className="profile-stat-box">
            <div className="profile-stat-num">{stats?.posts?.length || 0}</div>
            <div className="profile-stat-label">Tópicos</div>
          </div>
          <div className="profile-stat-box">
            <div className="profile-stat-num">{stats?.totalLikesReceived || 0}</div>
            <div className="profile-stat-label">Curtidas</div>
          </div>
          <div className="profile-stat-box">
            <div className="profile-stat-num">{stats?.favorites?.length || 0}</div>
            <div className="profile-stat-label">Favoritos</div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ Peixes Favoritos ({stats?.favorites?.length || 0})
        </button>
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          💬 Minhas Publicações ({stats?.posts?.length || 0})
        </button>
        <button
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Editar Perfil
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'favorites' && (
          <div>
            {(!stats?.favorites || stats.favorites.length === 0) ? (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🐠</span>
                <h3 style={{ fontSize: '1.4rem', marginTop: '16px' }}>Nenhum peixe favoritado</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Navegue pelo catálogo e clique no coração/estrela das espécies que você mais gosta!
                </p>
                <Link to="/catalog" className="btn btn-primary" style={{ marginTop: '20px' }}>
                  Ir para o Catálogo
                </Link>
              </div>
            ) : (
              <div className="fish-grid">
                {stats.favorites.map(fish => (
                  <article key={fish._id} className="card fish-card">
                    <div className="fish-card-img-wrapper">
                      <img src={fish.imageUrl} alt={fish.commonName} className="fish-card-img" />
                      <span className="fish-card-badge">{fish.category}</span>
                      <button
                        className="fish-card-favorite-btn active"
                        onClick={() => handleRemoveFavorite(fish._id)}
                        title="Remover dos favoritos"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </button>
                    </div>
                    <div className="fish-card-content">
                      <h3 className="fish-card-name" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{fish.commonName}</h3>
                      <p className="fish-card-scientific">{fish.scientificName}</p>
                      <p className="fish-card-desc">{fish.description}</p>
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                        <Link to={`/fishes/${fish._id}`} className="btn btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}>
                          Ficha Técnica
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="forum-content">
            {(!stats?.posts || stats.posts.length === 0) ? (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>💬</span>
                <h3 style={{ fontSize: '1.4rem', marginTop: '16px' }}>Nenhum tópico criado</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Você ainda não iniciou nenhuma discussão no fórum de discussões.
                </p>
                <Link to="/forum" className="btn btn-primary" style={{ marginTop: '20px' }}>
                  Ir para o Fórum
                </Link>
              </div>
            ) : (
              stats.posts.map(post => (
                <article key={post._id} className="card post-card animate-fade-in">
                  <div className="post-card-header">
                    <span className="post-card-date">
                      Criado em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="badge">{post.category}</span>
                  </div>
                  <Link to={`/posts/${post._id}`}>
                    <h3 className="post-card-title">{post.title}</h3>
                  </Link>
                  <p className="post-card-body">{post.content}</p>
                  <div className="post-card-footer">
                    <div className="post-card-stats">
                      <div className="post-stat">
                        <span>❤️</span>
                        <span>{post.likesCount || 0} curtidas</span>
                      </div>
                      <div className="post-stat">
                        <span>💬</span>
                        <span>{post.comments?.length || 0} comentários</span>
                      </div>
                    </div>
                    <Link to={`/posts/${post._id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      Ver Discussão
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card" style={{ padding: '40px', maxWidth: '600px', marginInline: 'auto' }}>
            <h3 style={{ marginBottom: '24px', textAlign: 'left' }}>Editar Minhas Informações</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profileName">Nome Completo</label>
                <input
                  type="text"
                  id="profileName"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profileEmail">Endereço de E-mail</label>
                <input
                  type="email"
                  id="profileEmail"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '24px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'left' }}>
                  Alterar Senha (deixe em branco para manter a atual)
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="profilePassword">Nova Senha</label>
                    <input
                      type="password"
                      id="profilePassword"
                      className="form-control"
                      placeholder="Mín. 6 dígitos"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profileConfirm">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      id="profileConfirm"
                      className="form-control"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ paddingInline: '32px' }} disabled={updating}>
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
