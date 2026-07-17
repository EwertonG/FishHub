import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FishForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, showToast } = useAuth();
  const isEditMode = !!id;

  // Form Field States
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState('Água Doce');
  const [description, setDescription] = useState('');
  const [temperament, setTemperament] = useState('Pacífico');
  const [diet, setDiet] = useState('Onívoro');
  const [averageSize, setAverageSize] = useState('');
  const [lifespan, setLifespan] = useState('');
  const [phMin, setPhMin] = useState('6.5');
  const [phMax, setPhMax] = useState('7.5');
  const [tempMin, setTempMin] = useState('22');
  const [tempMax, setTempMax] = useState('28');
  const [compatibility, setCompatibility] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Image Upload Type States
  const [imageType, setImageType] = useState('url'); // 'url' or 'file'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // If in edit mode, fetch fish details
  useEffect(() => {
    if (!token) {
      showToast('Você precisa estar logado para acessar esta página.', 'error');
      navigate('/login');
      return;
    }

    if (isEditMode) {
      async function fetchFish() {
        try {
          const res = await fetch(`/api/fishes/${id}`);
          if (!res.ok) {
            throw new Error('Falha ao carregar peixe.');
          }
          const data = await res.json();
          
          // Verify permissions: only creator or admin can edit
          const isAdmin = user && (user.email === 'admin@admin.com' || user.id === '6a583ed9a838f74b25344fcc');
          if (data.createdBy !== user.id && !isAdmin) {
            showToast('Você não tem permissão para editar esta espécie.', 'error');
            navigate('/catalog');
            return;
          }

          setCommonName(data.commonName);
          setScientificName(data.scientificName);
          setCategory(data.category);
          setDescription(data.description);
          setTemperament(data.temperament);
          setDiet(data.diet);
          setAverageSize(data.averageSize || '');
          setLifespan(data.lifespan || '');
          setPhMin(data.phMin);
          setPhMax(data.phMax);
          setTempMin(data.tempMin);
          setTempMax(data.tempMax);
          setCompatibility(data.compatibility ? data.compatibility.join(', ') : '');
          setImageUrl(data.imageUrl);
        } catch (err) {
          showToast(err.message || 'Erro ao carregar dados do peixe.', 'error');
          navigate('/catalog');
        } finally {
          setLoading(false);
        }
      }
      fetchFish();
    }
  }, [id, isEditMode, token, user, navigate]);

  // Clean up preview object URL on unmount
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commonName || !scientificName || !category || !description) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // Handle local image upload if applicable
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
        commonName,
        scientificName,
        category,
        description,
        temperament,
        diet,
        averageSize,
        lifespan,
        phMin,
        phMax,
        tempMin,
        tempMax,
        compatibility,
        imageUrl: finalImageUrl || undefined
      };

      const url = isEditMode ? `/api/fishes/${id}` : '/api/fishes';
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
        throw new Error(data.message || 'Erro ao salvar informações.');
      }

      showToast(isEditMode ? 'Espécie atualizada com sucesso!' : 'Espécie cadastrada com sucesso!');
      navigate(isEditMode ? `/fishes/${id}` : '/catalog');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>🐠</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Carregando formulário...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'left' }}>
          {isEditMode ? 'Editar Espécie' : 'Cadastrar Nova Espécie'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'left' }}>
          {isEditMode 
            ? 'Atualize as informações técnicas ou descrição desta espécie.' 
            : 'Preencha a ficha técnica para adicionar um novo peixe ao catálogo.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Nomes */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="commonName">Nome Popular *</label>
              <input
                type="text"
                id="commonName"
                className="form-control"
                placeholder="Ex: Neon Tetra"
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="scientificName">Nome Científico *</label>
              <input
                type="text"
                id="scientificName"
                className="form-control"
                placeholder="Ex: Paracheirodon innesi"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Categoria e Imagem */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="category">Categoria *</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Água Doce">Água Doce</option>
                <option value="Água Salgada">Água Salgada</option>
                <option value="Água Salobra">Água Salobra</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Origem da Imagem</label>
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
                  id="imageUrl"
                  className="form-control"
                  placeholder="https://exemplo.com/peixe.jpg"
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
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Descrição Detalhada *</label>
            <textarea
              id="description"
              className="form-control"
              rows="4"
              placeholder="Descreva o peixe, seu comportamento no aquário, curiosidades, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Temperamento e Dieta */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="temperament">Temperamento</label>
              <select
                id="temperament"
                className="form-control"
                value={temperament}
                onChange={(e) => setTemperament(e.target.value)}
              >
                <option value="Pacífico">Pacífico</option>
                <option value="Semi-agressivo">Semi-agressivo</option>
                <option value="Agressivo">Agressivo</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="diet">Alimentação</label>
              <input
                type="text"
                id="diet"
                className="form-control"
                placeholder="Ex: Flocos, Rações vivas, Onívoro"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
              />
            </div>
          </div>

          {/* Tamanho e Expectativa */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="averageSize">Tamanho Médio (cm)</label>
              <input
                type="number"
                step="0.1"
                id="averageSize"
                className="form-control"
                placeholder="Ex: 4"
                value={averageSize}
                onChange={(e) => setAverageSize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lifespan">Expectativa de Vida (anos)</label>
              <input
                type="number"
                step="0.5"
                id="lifespan"
                className="form-control"
                placeholder="Ex: 5"
                value={lifespan}
                onChange={(e) => setLifespan(e.target.value)}
              />
            </div>
          </div>

          {/* Parâmetros de pH e Temperatura */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phMin">pH Mínimo</label>
              <input
                type="number"
                step="0.1"
                id="phMin"
                className="form-control"
                placeholder="Ex: 5.5"
                value={phMin}
                onChange={(e) => setPhMin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phMax">pH Máximo</label>
              <input
                type="number"
                step="0.1"
                id="phMax"
                className="form-control"
                placeholder="Ex: 7.5"
                value={phMax}
                onChange={(e) => setPhMax(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tempMin">Temp. Mínima (°C)</label>
              <input
                type="number"
                id="tempMin"
                className="form-control"
                placeholder="Ex: 20"
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tempMax">Temp. Máxima (°C)</label>
              <input
                type="number"
                id="tempMax"
                className="form-control"
                placeholder="Ex: 28"
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
              />
            </div>
          </div>

          {/* Compatibilidade */}
          <div className="form-group">
            <label className="form-label" htmlFor="compatibility">Compatibilidade (separadas por vírgula)</label>
            <input
              type="text"
              id="compatibility"
              className="form-control"
              placeholder="Ex: Rodóstomos, Coridoras, Limpa Vidros"
              value={compatibility}
              onChange={(e) => setCompatibility(e.target.value)}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEditMode ? `/fishes/${id}` : '/catalog')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar Espécie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
