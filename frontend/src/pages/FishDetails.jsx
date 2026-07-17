import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FishDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, toggleFavorite, showToast } = useAuth();
  
  const [fish, setFish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  
  const [showAddModal, setShowAddModal] = useState(false);
  const [aquariums, setAquariums] = useState([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submittingInhabitant, setSubmittingInhabitant] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/fishes/${id}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar espécie.');
        }
        const data = await res.json();
        setFish(data);
      } catch (err) {
        showToast(err.message || 'Erro ao carregar detalhes.', 'error');
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza absoluta que deseja excluir este registro de espécie?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/fishes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao excluir.');
      }
      showToast('Espécie excluída com sucesso.');
      navigate('/catalog');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  };

  const handleOpenAddModal = async () => {
    if (!user) {
      showToast('Faça login para adicionar este peixe a um aquário.', 'error');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch('/api/aquariums', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAquariums(data);
        if (data.length > 0) {
          setSelectedAquariumId(data[0]._id);
        }
        setShowAddModal(true);
      }
    } catch (err) {
      showToast('Erro ao carregar lista de aquários.', 'error');
    }
  };

  const handleAddInhabitantSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAquariumId) {
      showToast('Selecione um aquário.', 'error');
      return;
    }
    setSubmittingInhabitant(true);
    try {
      const res = await fetch(`/api/aquariums/${selectedAquariumId}/inhabitants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'Peixe',
          speciesId: fish._id,
          speciesName: fish.commonName,
          quantity: parseInt(quantity),
          acquisitionDate: acquisitionDate,
          notes: notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao adicionar peixe.');

      showToast('Peixe adicionado ao seu aquário com sucesso!');
      setShowAddModal(false);
      setQuantity('1');
      setNotes('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingInhabitant(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🐠</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando dados da espécie...</p>
      </div>
    );
  }

  if (!fish) return null;

  const isFav = user?.favorites?.includes(fish._id);
  const isAdmin = user && (user.email === 'admin@admin.com' || user.id === '6a583ed9a838f74b25344fcc');
  const isCreator = user && (fish.createdBy === user.id || isAdmin);

  return (
    <div className="container section animate-fade-in">
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <Link to="/catalog" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          &larr; Voltar ao Catálogo
        </Link>
      </div>

      <div className="tank-frame">
        <div className="tank-header">
          <span>📋 Ficha Científica: {fish.commonName}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Código: {fish._id}</span>
        </div>
        <div className="tank-body">
          <div className="fish-details-grid">
            
            <div className="fish-details-img-card" style={{ border: '3px double var(--border-color)' }}>
              <img src={fish.imageUrl} alt={fish.commonName} className="fish-details-img" />
              {isCreator && (
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  <Link to={`/fishes/${fish._id}/edit`} className="btn btn-secondary" style={{ background: 'rgba(3, 12, 20, 0.85)', padding: '6px 12px', fontSize: '0.8rem' }}>
                    Editar
                  </Link>
                  <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={deleting}>
                    {deleting ? 'Removendo...' : 'Excluir'}
                  </button>
                </div>
              )}
            </div>

            
            <div className="fish-info-panel">
              <header className="fish-details-header">
                <span className="fish-details-category">{fish.category}</span>
                <div className="fish-details-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2.2rem', color: 'var(--accent)' }}>{fish.commonName}</h1>
                  <button
                    className={`fish-card-favorite-btn ${isFav ? 'active' : ''}`}
                    onClick={() => toggleFavorite(fish._id)}
                    style={{ position: 'relative', top: 0, right: 0 }}
                    title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                </div>
                <p className="fish-details-scientific">{fish.scientificName}</p>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge">👁️ {fish.views || 0} visualizações</span>
                  <span className="badge">⚖️ Temperamento: {fish.temperament}</span>
                </div>

                
                {user && (
                  <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ marginTop: '16px', width: '100%', display: 'flex', gap: '8px' }}>
                    <span>📥</span> Adicionar ao Meu Aquário
                  </button>
                )}
              </header>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--accent-light)' }}>Descrição Geral</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {fish.description}
                </p>
              </div>

              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-light)' }}>Parâmetros da Água</h3>
              <div className="parameter-grid">
                <div className="parameter-card">
                  <div className="parameter-label">Faixa de pH Recomendada</div>
                  <div className="parameter-value">🧪 pH {fish.phMin} - {fish.phMax}</div>
                </div>
                <div className="parameter-card">
                  <div className="parameter-label">Temperatura Operacional</div>
                  <div className="parameter-value">🌡️ {fish.tempMin}°C - {fish.tempMax}°C</div>
                </div>
              </div>

              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-light)' }}>Especificações Biológicas</h3>
              <div className="fish-spec-list" style={{ border: '1px solid var(--border-color)', padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                <div className="spec-item">
                  <span className="spec-label">Alimentação padrão</span>
                  <span className="spec-val" style={{ color: 'var(--text-primary)' }}>{fish.diet}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Tamanho Máx. Estimado</span>
                  <span className="spec-val" style={{ color: 'var(--text-primary)' }}>{fish.averageSize} cm</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Expectativa de Vida</span>
                  <span className="spec-val" style={{ color: 'var(--text-primary)' }}>{fish.lifespan} anos</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Comportamento Social</span>
                  <span className="spec-val" style={{ color: 'var(--text-primary)' }}>{fish.temperament}</span>
                </div>
              </div>

              
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--accent-light)' }}>Coabitação / Compatibilidade</h3>
                {fish.compatibility && fish.compatibility.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {fish.compatibility.map((item, idx) => (
                      <span key={idx} className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-light)' }}>
                        🤝 {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sem restrições de compatibilidade especificadas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 12, 20, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="tank-frame animate-fade-in" style={{ width: '100%', maxWidth: '480px', margin: '20px' }}>
            <div className="tank-header">
              <span>📥 Adicionar ao Meu Aquário</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>X</button>
            </div>
            <div className="tank-body">
              <form onSubmit={handleAddInhabitantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Cadastre o peixe <strong>{fish.commonName}</strong> como habitante em um de seus aquários.
                </p>
                
                {aquariums.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Você não possui aquários cadastrados.</p>
                    <Link to="/aquariums/new" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>Criar um Aquário</Link>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="selectAq">Selecionar Aquário *</label>
                      <select
                        id="selectAq"
                        className="form-control"
                        value={selectedAquariumId}
                        onChange={(e) => setSelectedAquariumId(e.target.value)}
                        required
                      >
                        {aquariums.map(aq => (
                          <option key={aq._id} value={aq._id}>{aq.name} ({aq.volume}L)</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="aqInhQty">Quantidade *</label>
                        <input
                          type="number"
                          id="aqInhQty"
                          className="form-control"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="aqInhDate">Data de Introdução</label>
                        <input
                          type="date"
                          id="aqInhDate"
                          className="form-control"
                          value={acquisitionDate}
                          onChange={(e) => setAcquisitionDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="aqInhNotes">Observações</label>
                      <input
                        type="text"
                        id="aqInhNotes"
                        className="form-control"
                        placeholder="Ex: Introduzidos após quarentena..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={submittingInhabitant}>
                        {submittingInhabitant ? 'Adicionando...' : 'Adicionar Habitante'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
