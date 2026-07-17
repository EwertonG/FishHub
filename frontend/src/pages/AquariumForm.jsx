import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AquariumForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, showToast } = useAuth();
  const isEditMode = !!id;

  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('Água Doce');
  const [volume, setVolume] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [setupDate, setSetupDate] = useState('');
  const [substrate, setSubstrate] = useState('');
  const [notes, setNotes] = useState('');

  
  const [imageType, setImageType] = useState('url'); 
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    const fileInput = document.getElementById('imageFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  useEffect(() => {
    if (!token) {
      showToast('Acesso negado. Por favor, faça login.', 'error');
      navigate('/login');
      return;
    }

    if (isEditMode) {
      async function fetchAquarium() {
        try {
          const res = await fetch(`/api/aquariums/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            throw new Error('Falha ao carregar dados do aquário.');
          }
          const data = await res.json();
          setName(data.name);
          setImageUrl(data.imageUrl);
          setType(data.type);
          setVolume(data.volume);
          setDimensions(data.dimensions || '');
          
          if (data.setupDate) {
            setSetupDate(new Date(data.setupDate).toISOString().split('T')[0]);
          }
          setSubstrate(data.substrate || '');
          setNotes(data.notes || '');
        } catch (err) {
          showToast(err.message, 'error');
          navigate('/aquariums');
        } finally {
          setLoading(false);
        }
      }
      fetchAquarium();
    } else {
      
      setSetupDate(new Date().toISOString().split('T')[0]);
    }
  }, [id, isEditMode, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !type || !volume) {
      showToast('Nome, Tipo e Litragem são campos obrigatórios.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      
      if (imageType === 'file' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Falha ao fazer upload da imagem.');
        }
        finalImageUrl = uploadData.imageUrl;
      }

      const bodyPayload = {
        name,
        imageUrl: finalImageUrl || undefined,
        type,
        volume: parseFloat(volume),
        dimensions,
        setupDate: setupDate ? new Date(setupDate).toISOString() : undefined,
        substrate,
        notes
      };

      const url = isEditMode ? `/api/aquariums/${id}` : '/api/aquariums';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao gravar informações.');
      }

      showToast(isEditMode ? 'Aquário atualizado com sucesso!' : 'Aquário criado com sucesso!');
      navigate('/aquariums');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza absoluta de que deseja excluir este aquário e TODO o seu histórico? Esta ação é irreversível.')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/aquariums/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao excluir aquário.');
      }
      showToast('Aquário excluído com sucesso.');
      navigate('/aquariums');
    } catch (err) {
      showToast(err.message, 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🏠</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando dados do formulário...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 16px', display: 'flex', justifyContent: 'center' }}>
      <div className="tank-frame" style={{ width: '100%', maxWidth: '700px' }}>
        <div className="tank-header">
          <span>{isEditMode ? '🔧 Editar Aquário' : '➕ Cadastrar Novo Aquário'}</span>
          {isEditMode && (
            <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} disabled={submitting}>
              Excluir Aquário
            </button>
          )}
        </div>

        <div className="tank-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="aqName">Nome do Aquário *</label>
              <input
                type="text"
                id="aqName"
                className="form-control"
                placeholder="Ex: Plantado da Sala, Comunitário, Reef de Corais"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="aqType">Tipo de Ecossistema *</label>
                <select
                  id="aqType"
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Água Doce">Água Doce</option>
                  <option value="Marinho">Marinho</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="aqVolume">Litragem Bruta (L) *</label>
                <input
                  type="number"
                  id="aqVolume"
                  className="form-control"
                  placeholder="Ex: 200"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="aqDimensions">Dimensões (LxPxA cm)</label>
                <input
                  type="text"
                  id="aqDimensions"
                  className="form-control"
                  placeholder="Ex: 100x40x50"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="aqSetupDate">Data da Montagem</label>
                <input
                  type="date"
                  id="aqSetupDate"
                  className="form-control"
                  value={setupDate}
                  onChange={(e) => setSetupDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Origem da Imagem da Foto do Aquário</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`btn ${imageType === 'url' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                  onClick={() => setImageType('url')}
                >
                  🔗 URL Externa
                </button>
                <button
                  type="button"
                  className={`btn ${imageType === 'file' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                  onClick={() => setImageType('file')}
                >
                  📁 Upload Local
                </button>
              </div>

              {imageType === 'url' ? (
                <input
                  type="url"
                  id="aqImage"
                  className="form-control"
                  placeholder="https://exemplo.com/aquario.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    className="form-control"
                    style={{ padding: '6px' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <p style={{ fontWeight: 700, margin: 0 }}>Preview da Imagem</p>
                          <p style={{ margin: 0 }}>{imageFile ? imageFile.name : ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={handleRemoveImage}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="aqSubstrate">Substrato Utilizado</label>
              <input
                type="text"
                id="aqSubstrate"
                className="form-control"
                placeholder="Ex: Areia de filtro de piscina, basalto, substrato fértil MBreda, etc."
                value={substrate}
                onChange={(e) => setSubstrate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="aqNotes">Observações de Configuração</label>
              <textarea
                id="aqNotes"
                className="form-control"
                rows="3"
                placeholder="Qualquer outro detalhe de inicialização do aquário..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/aquariums')}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar Aquário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
