import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AquariumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, showToast } = useAuth();

  // Aquarium state
  const [aquarium, setAquarium] = useState(null);
  const [loading, setLoading] = useState(true);

  // Catalog species (for adding fish)
  const [catalogFishes, setCatalogFishes] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, inhabitants, equipment, parameters, maintenance, feeding, gallery

  // Sub-resource Add Form States
  // Inhabitants
  const [showInhabitantForm, setShowInhabitantForm] = useState(false);
  const [inhType, setInhType] = useState('Peixe');
  const [inhSpeciesId, setInhSpeciesId] = useState('');
  const [inhSpeciesName, setInhSpeciesName] = useState('');
  const [inhQuantity, setInhQuantity] = useState('1');
  const [inhAcquisitionDate, setInhAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inhNotes, setInhNotes] = useState('');

  // Equipment
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqType, setEqType] = useState('Filtro');
  const [eqSpecs, setEqSpecs] = useState('');
  const [eqNotes, setEqNotes] = useState('');

  // Parameters
  const [showParamForm, setShowParamForm] = useState(false);
  const [pmDate, setPmDate] = useState(new Date().toISOString().split('T')[0]);
  const [pmTemp, setPmTemp] = useState('');
  const [pmPh, setPmPh] = useState('');
  const [pmAmmonia, setPmAmmonia] = useState('');
  const [pmNitrite, setPmNitrite] = useState('');
  const [pmNitrate, setPmNitrate] = useState('');
  const [pmGh, setPmGh] = useState('');
  const [pmKh, setPmKh] = useState('');
  const [pmNotes, setPmNotes] = useState('');

  // Maintenance
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [mtDate, setMtDate] = useState(new Date().toISOString().split('T')[0]);
  const [mtType, setMtType] = useState('TPA');
  const [mtDesc, setMtDesc] = useState('');
  const [mtImage, setMtImage] = useState('');

  // Feeding
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [fdDate, setFdDate] = useState(new Date().toISOString().split('T')[0]);
  const [fdTime, setFdTime] = useState('08:00');
  const [fdFoodType, setFdFoodType] = useState('');
  const [fdQty, setFdQty] = useState('');
  const [fdNotes, setFdNotes] = useState('');

  // Gallery
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [galImage, setGalImage] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galDate, setGalDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading/submitting block
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAquariumDetails = async () => {
    try {
      const res = await fetch(`/api/aquariums/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Falha ao carregar detalhes do aquário.');
      }
      const data = await res.json();
      setAquarium(data);
    } catch (err) {
      showToast(err.message, 'error');
      navigate('/aquariums');
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogFishes = async () => {
    try {
      const res = await fetch('/api/fishes');
      if (res.ok) {
        const data = await res.json();
        setCatalogFishes(data);
        if (data.length > 0) {
          setInhSpeciesId(data[0]._id);
          setInhSpeciesName(data[0].commonName);
        }
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAquariumDetails();
      fetchCatalogFishes();
    }
  }, [id, token]);

  // Subresource Submissions
  const handleAddInhabitant = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    let speciesNamePayload = inhSpeciesName;
    let speciesIdPayload = inhSpeciesId;

    if (inhType === 'Peixe') {
      const selected = catalogFishes.find(f => f._id === inhSpeciesId);
      if (selected) {
        speciesNamePayload = selected.commonName;
      }
    } else {
      speciesIdPayload = ''; // No catalog ID for non-fish items
    }

    if (!speciesNamePayload) {
      showToast('Por favor, especifique a espécie.', 'error');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/aquariums/${id}/inhabitants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: inhType,
          speciesId: speciesIdPayload || undefined,
          speciesName: speciesNamePayload,
          quantity: parseInt(inhQuantity),
          acquisitionDate: inhAcquisitionDate,
          notes: inhNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast('Habitante adicionado!');
      setInhNotes('');
      setShowInhabitantForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInhabitant = async (inhId) => {
    if (!window.confirm('Excluir este habitante?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/inhabitants/${inhId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Habitante removido.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover habitante.', 'error');
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/aquariums/${id}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: eqName,
          type: eqType,
          specs: eqSpecs,
          notes: eqNotes
        })
      });
      if (!res.ok) throw new Error('Erro ao adicionar equipamento.');
      showToast('Equipamento cadastrado!');
      setEqName('');
      setEqSpecs('');
      setEqNotes('');
      setShowEquipmentForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEquipment = async (eqId) => {
    if (!window.confirm('Excluir este equipamento?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/equipment/${eqId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Equipamento removido.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover equipamento.', 'error');
    }
  };

  const handleAddParameters = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/aquariums/${id}/parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: pmDate,
          temperature: pmTemp || undefined,
          ph: pmPh || undefined,
          ammonia: pmAmmonia || undefined,
          nitrite: pmNitrite || undefined,
          nitrate: pmNitrate || undefined,
          gh: pmGh || undefined,
          kh: pmKh || undefined,
          notes: pmNotes
        })
      });
      if (!res.ok) throw new Error('Erro ao salvar medição.');
      showToast('Medição de parâmetros registrada!');
      setPmTemp('');
      setPmPh('');
      setPmAmmonia('');
      setPmNitrite('');
      setPmNitrate('');
      setPmGh('');
      setPmKh('');
      setPmNotes('');
      setShowParamForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteParameter = async (paramId) => {
    if (!window.confirm('Excluir esta leitura de parâmetros?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/parameters/${paramId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Medição removida.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover medição.', 'error');
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/aquariums/${id}/maintenances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: mtDate,
          type: mtType,
          description: mtDesc,
          imageUrl: mtImage
        })
      });
      if (!res.ok) throw new Error('Erro ao adicionar manutenção.');
      showToast('Registro de manutenção salvo!');
      setMtDesc('');
      setMtImage('');
      setShowMaintForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaintenance = async (maintId) => {
    if (!window.confirm('Excluir este registro de manutenção?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/maintenances/${maintId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Manutenção removida.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover manutenção.', 'error');
    }
  };

  const handleAddFeeding = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/aquariums/${id}/feedings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: fdDate,
          time: fdTime,
          foodType: fdFoodType,
          quantity: fdQty,
          notes: fdNotes
        })
      });
      if (!res.ok) throw new Error('Erro ao registrar alimentação.');
      showToast('Alimentação registrada!');
      setFdFoodType('');
      setFdQty('');
      setFdNotes('');
      setShowFeedForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFeeding = async (feedId) => {
    if (!window.confirm('Excluir esta alimentação?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/feedings/${feedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Alimentação removida.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover alimentação.', 'error');
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/aquariums/${id}/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: galImage,
          caption: galCaption,
          date: galDate
        })
      });
      if (!res.ok) throw new Error('Erro ao adicionar foto.');
      showToast('Foto adicionada à galeria!');
      setGalImage('');
      setGalCaption('');
      setShowPhotoForm(false);
      fetchAquariumDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Excluir esta foto da galeria?')) return;
    try {
      const res = await fetch(`/api/aquariums/${id}/gallery/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('Foto excluída.');
        fetchAquariumDetails();
      }
    } catch (err) {
      showToast('Erro ao remover foto.', 'error');
    }
  };

  // Helper Stats Calculation
  const getDaysSinceSetup = (setupDate) => {
    const diffTime = Math.abs(new Date() - new Date(setupDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 dia' : `${diffDays} dias`;
  };

  const getInhabitantsCount = () => {
    if (!aquarium?.inhabitants) return 0;
    return aquarium.inhabitants.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  };

  const getLatestParameterVal = (field, unit = '') => {
    if (!aquarium?.parameters || aquarium.parameters.length === 0) return 'N/A';
    const sorted = [...aquarium.parameters].sort((a, b) => new Date(b.date) - new Date(a.date));
    const val = sorted[0][field];
    return val !== undefined && val !== null ? `${val}${unit}` : 'N/A';
  };

  const getLatestMaintenance = () => {
    if (!aquarium?.maintenances || aquarium.maintenances.length === 0) return 'Nenhuma registrada';
    const sorted = [...aquarium.maintenances].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `${new Date(sorted[0].date).toLocaleDateString('pt-BR')} (${sorted[0].type})`;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🏠</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando estatísticas do aquário...</p>
      </div>
    );
  }

  if (!aquarium) return null;

  return (
    <div className="container section animate-fade-in">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/aquariums" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          &larr; Voltar para Meus Aquários
        </Link>
        <Link to={`/aquariums/${aquarium._id}/edit`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Editar Configurações
        </Link>
      </div>

      <header className="hero" style={{ padding: '20px 0', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
        <img src={aquarium.imageUrl} alt={aquarium.name} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid var(--accent)' }} />
        <div>
          <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2rem', color: 'var(--accent)' }}>{aquarium.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Ecossistema de <strong>{aquarium.volume} Litros</strong> | Tipo: <strong>{aquarium.type}</strong>
          </p>
        </div>
      </header>

      {/* Main Dashboard view */}
      <div className="tank-frame">
        <div className="tank-header">
          <span>📊 Painel de Monitoramento (Dashboard)</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Código ID: {aquarium._id}</span>
        </div>
        <div className="tank-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Total Inhabitants */}
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Habitantes</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>{getInhabitantsCount()}</div>
            </div>
            {/* Setup Age */}
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tempo de Montagem</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{getDaysSinceSetup(aquarium.setupDate)}</div>
            </div>
            {/* Temp parameter */}
            <div style={{ background: '#02070c', padding: '16px', border: '2px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Temperatura Atual</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00ffff', fontFamily: 'monospace', marginTop: '4px' }}>{getLatestParameterVal('temperature')}</div>
            </div>
            {/* pH parameter */}
            <div style={{ background: '#02070c', padding: '16px', border: '2px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>pH Atual</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00ffff', fontFamily: 'monospace', marginTop: '4px' }}>{getLatestParameterVal('ph')}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', textAlign: 'left' }}>
            <div>🔧 <strong>Última Manutenção:</strong> {getLatestMaintenance()}</div>
            {aquarium.substrate && <div style={{ marginTop: '6px' }}>🏜️ <strong>Substrato:</strong> {aquarium.substrate}</div>}
            {aquarium.notes && <div style={{ marginTop: '6px' }}>📝 <strong>Notas Técnicas:</strong> {aquarium.notes}</div>}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="profile-tabs" style={{ marginBottom: '24px' }}>
        <button className={`profile-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={`profile-tab ${activeTab === 'inhabitants' ? 'active' : ''}`} onClick={() => setActiveTab('inhabitants')}>
          🐟 Habitantes ({aquarium.inhabitants?.length || 0})
        </button>
        <button className={`profile-tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
          ⚙️ Equipamentos ({aquarium.equipment?.length || 0})
        </button>
        <button className={`profile-tab ${activeTab === 'parameters' ? 'active' : ''}`} onClick={() => setActiveTab('parameters')}>
          💧 Parâmetros ({aquarium.parameters?.length || 0})
        </button>
        <button className={`profile-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
          🛠️ Manutenções ({aquarium.maintenances?.length || 0})
        </button>
        <button className={`profile-tab ${activeTab === 'feeding' ? 'active' : ''}`} onClick={() => setActiveTab('feeding')}>
          🍽️ Alimentações ({aquarium.feedings?.length || 0})
        </button>
        <button className={`profile-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
          📷 Galeria ({aquarium.gallery?.length || 0})
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="animate-fade-in">
        
        {/* DASHBOARD TAB (History summary) */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
            {/* Latest parameters summary */}
            <div className="tank-frame">
              <div className="tank-header">
                <span>Leituras de Água Recentes</span>
                <button onClick={() => setActiveTab('parameters')} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Ver Histórico</button>
              </div>
              <div className="tank-body">
                {(!aquarium.parameters || aquarium.parameters.length === 0) ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Sem medições periódicas registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...aquarium.parameters].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map((pm, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>📅 {new Date(pm.date).toLocaleDateString('pt-BR')}</span>
                        <span>🌡️ {pm.temperature ? `${pm.temperature}°C` : 'N/A'} | 🧪 pH {pm.ph || 'N/A'} | 🧪 NH3 {pm.ammonia !== null ? pm.ammonia : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Latest maintenance summary */}
            <div className="tank-frame">
              <div className="tank-header">
                <span>Manutenções Recentes</span>
                <button onClick={() => setActiveTab('maintenance')} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Ver Todas</button>
              </div>
              <div className="tank-body">
                {(!aquarium.maintenances || aquarium.maintenances.length === 0) ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Sem manutenções registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...aquarium.maintenances].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map((mt, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <div className="flex-between" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          <span>🛠️ {mt.type}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{new Date(mt.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div style={{ marginTop: '4px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mt.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INHABITANTS TAB */}
        {activeTab === 'inhabitants' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowInhabitantForm(prev => !prev)} className="btn btn-primary">
                {showInhabitantForm ? 'Fechar Formulário' : '+ Adicionar Habitante'}
              </button>
            </div>

            {showInhabitantForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Registrar Novo Habitante</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddInhabitant} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="inhType">Tipo de Organismo</label>
                        <select id="inhType" className="form-control" value={inhType} onChange={(e) => setInhType(e.target.value)}>
                          <option value="Peixe">Peixe</option>
                          <option value="Planta">Planta</option>
                          <option value="Camarão">Camarão</option>
                          <option value="Caramujo">Caramujo</option>
                        </select>
                      </div>

                      {inhType === 'Peixe' ? (
                        <div className="form-group">
                          <label className="form-label" htmlFor="inhSpeciesSelect">Escolher Peixe do Catálogo *</label>
                          {catalogFishes.length > 0 ? (
                            <select
                              id="inhSpeciesSelect"
                              className="form-control"
                              value={inhSpeciesId}
                              onChange={(e) => {
                                setInhSpeciesId(e.target.value);
                                const f = catalogFishes.find(item => item._id === e.target.value);
                                if (f) setInhSpeciesName(f.commonName);
                              }}
                            >
                              {catalogFishes.map(f => (
                                <option key={f._id} value={f._id}>{f.commonName} ({f.scientificName})</option>
                              ))}
                            </select>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--coral)', marginTop: '8px' }}>
                              Nenhum peixe cadastrado no catálogo geral. <Link to="/fishes/new">Cadastre um peixe primeiro</Link>.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="form-group">
                          <label className="form-label" htmlFor="inhSpeciesName">Espécie *</label>
                          <input
                            type="text"
                            id="inhSpeciesName"
                            className="form-control"
                            placeholder="Ex: Anubia barteri, Red Cherry..."
                            value={inhSpeciesName}
                            onChange={(e) => setInhSpeciesName(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="inhQty">Quantidade inserida *</label>
                        <input
                          type="number"
                          id="inhQty"
                          className="form-control"
                          value={inhQuantity}
                          onChange={(e) => setInhQuantity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="inhDate">Data de Introdução</label>
                        <input
                          type="date"
                          id="inhDate"
                          className="form-control"
                          value={inhAcquisitionDate}
                          onChange={(e) => setInhAcquisitionDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inhNotes">Observações</label>
                      <input
                        type="text"
                        id="inhNotes"
                        className="form-control"
                        placeholder="Ex: Jovens comprados na loja local..."
                        value={inhNotes}
                        onChange={(e) => setInhNotes(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowInhabitantForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Habitante</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.inhabitants || aquarium.inhabitants.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum habitante cadastrado neste aquário.</p>
            ) : (
              <div className="forum-rows-container" style={{ border: '1px solid var(--border-color)' }}>
                <div className="forum-table-header">
                  <span>Espécie / Tipo</span>
                  <span style={{ textAlign: 'center' }}>Quantidade / Introdução</span>
                  <span style={{ textAlign: 'right' }}>Ações</span>
                </div>
                {aquarium.inhabitants.map(inh => (
                  <div key={inh._id} className="forum-row-item">
                    <div>
                      <strong>{inh.speciesName}</strong>
                      <span className="badge" style={{ marginLeft: '8px' }}>{inh.type}</span>
                      {inh.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{inh.notes}</div>}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div>{inh.quantity} unidades</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>em {new Date(inh.acquisitionDate).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {inh.speciesId && (
                        <Link to={`/fishes/${inh.speciesId}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                          Ficha Técnica
                        </Link>
                      )}
                      <button onClick={() => handleDeleteInhabitant(inh._id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EQUIPMENT TAB */}
        {activeTab === 'equipment' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowEquipmentForm(prev => !prev)} className="btn btn-primary">
                {showEquipmentForm ? 'Fechar Formulário' : '+ Adicionar Equipamento'}
              </button>
            </div>

            {showEquipmentForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Cadastrar Novo Equipamento</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="eqName">Nome do Equipamento *</label>
                        <input
                          type="text"
                          id="eqName"
                          className="form-control"
                          placeholder="Ex: Canister Hopar 1000L/H"
                          value={eqName}
                          onChange={(e) => setEqName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="eqType">Tipo de Equipamento</label>
                        <select id="eqType" className="form-control" value={eqType} onChange={(e) => setEqType(e.target.value)}>
                          <option value="Filtro">Filtro</option>
                          <option value="Aquecedor">Aquecedor / Termostato</option>
                          <option value="Termômetro">Termômetro</option>
                          <option value="Iluminação">Iluminação</option>
                          <option value="CO2">Sistema de CO₂</option>
                          <option value="Bomba de circulação">Bomba de Circulação</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="eqSpecs">Especificações Técnicas</label>
                        <input
                          type="text"
                          id="eqSpecs"
                          className="form-control"
                          placeholder="Ex: 110V, 150 Watts, Vazão 800 L/h"
                          value={eqSpecs}
                          onChange={(e) => setEqSpecs(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="eqNotes">Observações / Data de instalação</label>
                        <input
                          type="text"
                          id="eqNotes"
                          className="form-control"
                          placeholder="Ex: Instalado com mídias cerâmicas extras..."
                          value={eqNotes}
                          onChange={(e) => setEqNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowEquipmentForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Equipamento</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.equipment || aquarium.equipment.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum equipamento instalado neste aquário.</p>
            ) : (
              <div className="forum-rows-container" style={{ border: '1px solid var(--border-color)' }}>
                <div className="forum-table-header">
                  <span>Equipamento / Tipo</span>
                  <span>Especificações</span>
                  <span style={{ textAlign: 'right' }}>Ações</span>
                </div>
                {aquarium.equipment.map(eq => (
                  <div key={eq._id} className="forum-row-item">
                    <div>
                      <strong>{eq.name}</strong>
                      <span className="badge" style={{ marginLeft: '8px' }}>{eq.type}</span>
                      {eq.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{eq.notes}</div>}
                    </div>
                    <div>{eq.specs || 'N/A'}</div>
                    <div style={{ textAlign: 'right' }}>
                      <button onClick={() => handleDeleteEquipment(eq._id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WATER PARAMETERS TAB */}
        {activeTab === 'parameters' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowParamForm(prev => !prev)} className="btn btn-primary">
                {showParamForm ? 'Fechar Formulário' : '+ Registrar Medição'}
              </button>
            </div>

            {showParamForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Registrar Novas Medições da Água</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddParameters} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmDate">Data da Leitura *</label>
                        <input type="date" id="pmDate" className="form-control" value={pmDate} onChange={(e) => setPmDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmTemp">Temperatura (°C)</label>
                        <input type="number" step="0.1" id="pmTemp" className="form-control" placeholder="Ex: 24.5" value={pmTemp} onChange={(e) => setPmTemp(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmPh">Potencial Hidrogênio (pH)</label>
                        <input type="number" step="0.1" id="pmPh" className="form-control" placeholder="Ex: 6.8" value={pmPh} onChange={(e) => setPmPh(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmAmm">Amônia (ppm)</label>
                        <input type="number" step="0.01" id="pmAmm" className="form-control" placeholder="Ex: 0" value={pmAmmonia} onChange={(e) => setPmAmmonia(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmNitrite">Nitrito (ppm)</label>
                        <input type="number" step="0.01" id="pmNitrite" className="form-control" placeholder="Ex: 0" value={pmNitrite} onChange={(e) => setPmNitrite(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmNitrate">Nitrato (ppm)</label>
                        <input type="number" step="0.1" id="pmNitrate" className="form-control" placeholder="Ex: 10" value={pmNitrate} onChange={(e) => setPmNitrate(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmGh">Dureza Geral (GH)</label>
                        <input type="number" id="pmGh" className="form-control" placeholder="Ex: 4" value={pmGh} onChange={(e) => setPmGh(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="pmKh">Dureza Carbonatos (KH)</label>
                        <input type="number" id="pmKh" className="form-control" placeholder="Ex: 2" value={pmKh} onChange={(e) => setPmKh(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="pmNotes">Observações</label>
                      <input type="text" id="pmNotes" className="form-control" placeholder="Ex: Leitura feita após a TPA semanal..." value={pmNotes} onChange={(e) => setPmNotes(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowParamForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Medição</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.parameters || aquarium.parameters.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Sem histórico de parâmetros medidos.</p>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--header-bg)', color: 'var(--accent-light)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Data</th>
                      <th style={{ padding: '10px' }}>Temp</th>
                      <th style={{ padding: '10px' }}>pH</th>
                      <th style={{ padding: '10px' }}>Amônia</th>
                      <th style={{ padding: '10px' }}>Nitrito</th>
                      <th style={{ padding: '10px' }}>Nitrato</th>
                      <th style={{ padding: '10px' }}>GH/KH</th>
                      <th style={{ padding: '10px' }}>Observações</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...aquarium.parameters].sort((a,b) => new Date(b.date) - new Date(a.date)).map((pm) => (
                      <tr key={pm._id} style={{ borderBottom: '1px solid var(--border-color)' }} className="forum-row-item-tr">
                        <td style={{ padding: '10px' }}>{new Date(pm.date).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '10px', color: '#00ffff', fontFamily: 'monospace' }}>{pm.temperature ? `${pm.temperature}°C` : '-'}</td>
                        <td style={{ padding: '10px', color: '#00ffff', fontFamily: 'monospace' }}>{pm.ph || '-'}</td>
                        <td style={{ padding: '10px' }}>{pm.ammonia !== null ? `${pm.ammonia} ppm` : '-'}</td>
                        <td style={{ padding: '10px' }}>{pm.nitrite !== null ? `${pm.nitrite} ppm` : '-'}</td>
                        <td style={{ padding: '10px' }}>{pm.nitrate !== null ? `${pm.nitrate} ppm` : '-'}</td>
                        <td style={{ padding: '10px' }}>{pm.gh !== null ? `GH:${pm.gh}` : ''} {pm.kh !== null ? `KH:${pm.kh}` : ''}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{pm.notes || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteParameter(pm._id)} className="btn btn-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowMaintForm(prev => !prev)} className="btn btn-primary">
                {showMaintForm ? 'Fechar Formulário' : '+ Registrar Manutenção'}
              </button>
            </div>

            {showMaintForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Registrar Histórico de Manutenção</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="mtDate">Data da Manutenção *</label>
                        <input type="date" id="mtDate" className="form-control" value={mtDate} onChange={(e) => setMtDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="mtType">Tipo de Atividade</label>
                        <select id="mtType" className="form-control" value={mtType} onChange={(e) => setMtType(e.target.value)}>
                          <option value="TPA">Troca Parcial de Água (TPA)</option>
                          <option value="Limpeza de Filtro">Limpeza de Filtro</option>
                          <option value="Troca de Mídias">Troca de Mídias filtrantes</option>
                          <option value="Sifonagem">Sifonagem de Substrato</option>
                          <option value="Poda">Poda de Plantas</option>
                          <option value="Outra">Outra Manutenção</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="mtDesc">Descrição da Atividade *</label>
                      <textarea id="mtDesc" className="form-control" rows="3" placeholder="Ex: TPA de 30% com água condicionada com Prime. Limpeza do perlon." value={mtDesc} onChange={(e) => setMtDesc(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="mtImage">URL de Imagem Opcional (Comprovação/Antes-Depois)</label>
                      <input type="url" id="mtImage" className="form-control" placeholder="https://exemplo.com/manutencao.jpg" value={mtImage} onChange={(e) => setMtImage(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowMaintForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Registro</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.maintenances || aquarium.maintenances.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Sem manutenções registradas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...aquarium.maintenances].sort((a,b) => new Date(b.date) - new Date(a.date)).map((mt) => (
                  <div key={mt._id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>🛠️ {mt.type}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 {new Date(mt.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{mt.description}</p>
                      {mt.imageUrl && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={mt.imageUrl} alt="Registro" style={{ maxWidth: '120px', maxHeight: '100px', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleDeleteMaintenance(mt._id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem', marginLeft: '16px' }}>
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDINGS TAB */}
        {activeTab === 'feeding' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowFeedForm(prev => !prev)} className="btn btn-primary">
                {showFeedForm ? 'Fechar Formulário' : '+ Registrar Alimentação'}
              </button>
            </div>

            {showFeedForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Registrar Nova Alimentação</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddFeeding} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="fdDate">Data *</label>
                        <input type="date" id="fdDate" className="form-control" value={fdDate} onChange={(e) => setFdDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="fdTime">Horário *</label>
                        <input type="time" id="fdTime" className="form-control" value={fdTime} onChange={(e) => setFdTime(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="fdFood">Tipo de Alimento *</label>
                        <input type="text" id="fdFood" className="form-control" placeholder="Ex: Ração flocada, artêmias, microvermes..." value={fdFoodType} onChange={(e) => setFdFoodType(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="fdQty">Quantidade / Dose</label>
                        <input type="text" id="fdQty" className="form-control" placeholder="Ex: 1 pitada, 2ml..." value={fdQty} onChange={(e) => setFdQty(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="fdNotes">Observações</label>
                      <input type="text" id="fdNotes" className="form-control" placeholder="Ex: Comeram tudo rapidamente..." value={fdNotes} onChange={(e) => setFdNotes(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowFeedForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Registro</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.feedings || aquarium.feedings.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Sem registros de alimentações.</p>
            ) : (
              <div className="forum-rows-container" style={{ border: '1px solid var(--border-color)' }}>
                <div className="forum-table-header">
                  <span>Data / Hora</span>
                  <span>Alimento / Quantidade</span>
                  <span style={{ textAlign: 'right' }}>Ações</span>
                </div>
                {[...aquarium.feedings].sort((a,b) => new Date(b.date) - new Date(a.date) || b.time.localeCompare(a.time)).map((fd) => (
                  <div key={fd._id} className="forum-row-item">
                    <div>
                      <strong>📅 {new Date(fd.date).toLocaleDateString('pt-BR')}</strong> às {fd.time}
                      {fd.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{fd.notes}</div>}
                    </div>
                    <div>
                      {fd.foodType} {fd.quantity ? `(${fd.quantity})` : ''}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button onClick={() => handleDeleteFeeding(fd._id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowPhotoForm(prev => !prev)} className="btn btn-primary">
                {showPhotoForm ? 'Fechar Formulário' : '+ Adicionar Foto'}
              </button>
            </div>

            {showPhotoForm && (
              <div className="tank-frame" style={{ marginBottom: '24px' }}>
                <div className="tank-header"><span>Adicionar Foto à Galeria</span></div>
                <div className="tank-body">
                  <form onSubmit={handleAddPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="galImg">URL da Imagem *</label>
                      <input type="url" id="galImg" className="form-control" placeholder="https://exemplo.com/foto-aquario.jpg" value={galImage} onChange={(e) => setGalImage(e.target.value)} required />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="galCap">Legenda / Descrição</label>
                        <input type="text" id="galCap" className="form-control" placeholder="Ex: Dia 30 - Plantas crescendo..." value={galCaption} onChange={(e) => setGalCaption(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="galDt">Data do Registro</label>
                        <input type="date" id="galDt" className="form-control" value={galDate} onChange={(e) => setGalDate(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowPhotoForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar Foto</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List */}
            {(!aquarium.gallery || aquarium.gallery.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma foto adicionada à galeria.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {[...aquarium.gallery].sort((a,b) => new Date(b.date) - new Date(a.date)).map((pic) => (
                  <div key={pic._id} className="fish-card" style={{ border: '1px solid var(--border-color)' }}>
                    <div style={{ height: '150px', position: 'relative' }}>
                      <img src={pic.imageUrl} alt={pic.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => handleDeletePhoto(pic._id)} className="btn btn-danger" style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', borderRadius: 'var(--radius-sm)' }} title="Excluir Foto">
                        🗑️
                      </button>
                    </div>
                    <div style={{ padding: '10px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700 }}>{pic.caption || 'Sem legenda'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                        📅 {new Date(pic.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
