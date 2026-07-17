import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AquariumsList() {
  const { token, showToast } = useAuth();
  const [aquariums, setAquariums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAquariums() {
      try {
        const res = await fetch('/api/aquariums', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAquariums(data);
        }
      } catch (err) {
        console.error('Error fetching aquariums:', err);
        showToast('Erro ao carregar lista de aquários.', 'error');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchAquariums();
    }
  }, [token]);

  // Helper functions to get stats from nesting arrays
  const getInhabitantsCount = (inhabitants) => {
    if (!inhabitants || inhabitants.length === 0) return 0;
    return inhabitants.reduce((acc, current) => acc + (current.quantity || 0), 0);
  };

  const getLatestParameter = (parameters, field) => {
    if (!parameters || parameters.length === 0) return 'N/A';
    // Sort parameters by date descending
    const sorted = [...parameters].sort((a, b) => new Date(b.date) - new Date(a.date));
    const val = sorted[0][field];
    if (val === undefined || val === null) return 'N/A';
    return field === 'temperature' ? `${val}°C` : `pH ${val}`;
  };

  const getLatestMaintenanceDate = (maintenances) => {
    if (!maintenances || maintenances.length === 0) return 'Nenhuma';
    const sorted = [...maintenances].sort((a, b) => new Date(b.date) - new Date(a.date));
    return new Date(sorted[0].date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container section animate-fade-in">
      <header className="hero" style={{ padding: '24px 0', marginBottom: '24px' }}>
        <h1 style={{ border: 'none', padding: 0, margin: 0, fontSize: '2.2rem', color: 'var(--accent)' }}>🏠 Meus Aquários</h1>
        <p style={{ marginTop: '6px', fontSize: '0.95rem' }}>Painel Central de Gerenciamento de Ecossistemas Pessoais</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Link to="/aquariums/new" className="btn btn-primary">
          + Criar Novo Aquário
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <span style={{ fontSize: '2rem' }}>🏠</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando seus aquários...</p>
        </div>
      ) : aquariums.length === 0 ? (
        <div className="tank-frame" style={{ maxWidth: '600px', marginInline: 'auto' }}>
          <div className="tank-header">
            <span>Nenhum Aquário Encontrado</span>
          </div>
          <div className="tank-body text-center" style={{ padding: '40px 20px' }}>
            <span style={{ fontSize: '3rem' }}>🐠</span>
            <h3 style={{ marginTop: '16px', fontSize: '1.4rem' }}>Nenhum aquário cadastrado</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', marginInline: 'auto' }}>
              Para começar a monitorar seus parâmetros da água, gerenciar peixes e equipamentos, adicione seu primeiro aquário!
            </p>
            <Link to="/aquariums/new" className="btn btn-primary" style={{ marginTop: '24px' }}>
              Cadastrar Meu Primeiro Aquário
            </Link>
          </div>
        </div>
      ) : (
        <div className="fish-grid">
          {aquariums.map(aq => (
            <article key={aq._id} className="fish-card" style={{ border: '3px double var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div className="fish-card-img-wrapper" style={{ height: '180px' }}>
                <img src={aq.imageUrl} alt={aq.name} className="fish-card-img" />
                <span className="fish-card-badge" style={{ background: aq.type === 'Marinho' ? '#0077b6' : '#2e8b57' }}>
                  {aq.type}
                </span>
              </div>
              
              <div className="fish-card-content" style={{ padding: '16px' }}>
                <h3 className="fish-card-name" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>{aq.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Litragem: <strong>{aq.volume} Litros</strong> {aq.dimensions ? `(${aq.dimensions})` : ''}
                </p>

                {/* Dashboard preview values */}
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Habitantes:</span>
                    <span style={{ fontWeight: 700 }}>{getInhabitantsCount(aq.inhabitants)}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Temperatura:</span>
                    <span style={{ fontWeight: 700, color: '#00ffff' }}>{getLatestParameter(aq.parameters, 'temperature')}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>pH Atual:</span>
                    <span style={{ fontWeight: 700, color: '#00ffff' }}>{getLatestParameter(aq.parameters, 'ph')}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Última Manutenção:</span>
                    <span style={{ fontWeight: 700 }}>{getLatestMaintenanceDate(aq.maintenances)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Link to={`/aquariums/${aq._id}`} className="btn btn-primary" style={{ flex: 2, padding: '8px 12px', fontSize: '0.85rem' }}>
                    Dashboard
                  </Link>
                  <Link to={`/aquariums/${aq._id}/edit`} className="btn btn-outline" style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}>
                    Editar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
