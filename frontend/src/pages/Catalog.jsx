import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Catalog() {
  const { toggleFavorite, user } = useAuth();
  const [fishes, setFishes] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [temperament, setTemperament] = useState('');
  const [phFilter, setPhFilter] = useState(''); 
  const [tempFilter, setTempFilter] = useState(''); 
  const [sortBy, setSortBy] = useState('newest'); 

  const searchTimeoutRef = useRef(null);

  const fetchFishes = async (searchVal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (category) params.append('category', category);
      if (temperament) params.append('temperament', temperament);
      if (sortBy) params.append('sortBy', sortBy);

      if (phFilter === 'acid') {
        params.append('maxPh', '6.5');
      } else if (phFilter === 'neutral') {
        params.append('minPh', '6.5');
        params.append('maxPh', '7.5');
      } else if (phFilter === 'alkaline') {
        params.append('minPh', '7.5');
      }

      if (tempFilter === 'cold') {
        params.append('maxTemp', '22');
      } else if (tempFilter === 'tropical') {
        params.append('minTemp', '22');
        params.append('maxTemp', '28');
      } else if (tempFilter === 'warm') {
        params.append('minTemp', '28');
      }

      const res = await fetch(`/api/fishes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFishes(data);
      }
    } catch (err) {
      console.error('Error loading fishes catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFishes(search);
  }, [category, temperament, phFilter, tempFilter, sortBy]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchFishes(val);
    }, 350);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setTemperament('');
    setPhFilter('');
    setTempFilter('');
    setSortBy('newest');
    fetchFishes('');
  };

  return (
    <div className="container section animate-fade-in">
      <header className="hero" style={{ padding: '24px 0', marginBottom: '24px' }}>
        <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2.2rem', color: 'var(--accent)' }}>📋 Catálogo de Espécies</h1>
        <p style={{ marginTop: '6px', fontSize: '0.95rem' }}>Painel Técnico de Identificação de Peixes Ornamentais</p>
      </header>

      <div className="catalog-layout">
        
        <aside className="filter-sidebar" style={{ border: '3px double var(--tank-rim)' }}>
          <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
            <h3 className="filter-title" style={{ border: 'none', padding: 0, margin: 0 }}>Painel de Filtros</h3>
            <button
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Resetar
            </button>
          </div>

          <div className="filter-section">
            <label className="filter-section-title">Pesquisa Rápida</label>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Nome vulgar ou científico..."
                className="form-control search-input"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="filter-section">
            <label className="filter-section-title" htmlFor="categorySelect">Tipo de Água</label>
            <select
              id="categorySelect"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Água Doce">Água Doce</option>
              <option value="Água Salgada">Água Salgada</option>
              <option value="Água Salobra">Água Salobra</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-section-title" htmlFor="temperamentSelect">Comportamento</label>
            <select
              id="temperamentSelect"
              className="form-control"
              value={temperament}
              onChange={(e) => setTemperament(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Pacífico">Pacífico</option>
              <option value="Semi-agressivo">Semi-agressivo</option>
              <option value="Agressivo">Agressivo</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-section-title" htmlFor="phSelect">Acidez (pH)</label>
            <select
              id="phSelect"
              className="form-control"
              value={phFilter}
              onChange={(e) => setPhFilter(e.target.value)}
            >
              <option value="">Qualquer pH</option>
              <option value="acid">Ácido (pH &lt; 6.5)</option>
              <option value="neutral">Neutro (pH 6.5 - 7.5)</option>
              <option value="alkaline">Alcalino (pH &gt; 7.5)</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-section-title" htmlFor="tempSelect">Temperatura (°C)</label>
            <select
              id="tempSelect"
              className="form-control"
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
            >
              <option value="">Qualquer temp.</option>
              <option value="cold">Água Fria (&lt; 22°C)</option>
              <option value="tropical">Tropical (22°C - 28°C)</option>
              <option value="warm">Água Quente (&gt; 28°C)</option>
            </select>
          </div>

          <div className="filter-section" style={{ margin: 0 }}>
            <label className="filter-section-title" htmlFor="sortBySelect">Ordenação</label>
            <select
              id="sortBySelect"
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Cadastrados recentes</option>
              <option value="views">Mais populares (Visualizações) 👁️</option>
              <option value="name">Alfabética (A-Z)</option>
            </select>
          </div>
        </aside>

        
        <main className="tank-frame">
          <div className="tank-header">
            <span>🐟 Espécies Encontradas ({fishes.length})</span>
            {user && (
              <Link to="/fishes/new" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                + Novo Peixe
              </Link>
            )}
          </div>
          
          <div className="tank-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '1.5rem' }}>🐠</span>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Lendo registros de espécies...</p>
              </div>
            ) : fishes.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🔍</span>
                <h3 style={{ fontSize: '1.3rem', marginTop: '12px' }}>Nenhum Registro</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Não encontramos peixes que atendam a esses filtros.
                </p>
                <button onClick={handleClearFilters} className="btn btn-outline" style={{ marginTop: '16px' }}>
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="fish-grid">
                {fishes.map(fish => {
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
        </main>
      </div>
    </div>
  );
}
