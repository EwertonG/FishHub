import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fishhub_token') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          
          localStorage.removeItem('fishhub_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao fazer login');
    }
    localStorage.setItem('fishhub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showToast('Login realizado com sucesso!');
    return data.user;
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao registrar');
    }
    localStorage.setItem('fishhub_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showToast('Conta criada com sucesso!');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fishhub_token');
    setToken(null);
    setUser(null);
    showToast('Sessão encerrada.');
  };

  const updateProfile = async (name, email, password) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao atualizar perfil');
    }
    setUser(data.user);
    showToast('Perfil atualizado com sucesso!');
    return data.user;
  };

  const toggleFavorite = async (fishId) => {
    if (!user) {
      showToast('Faça login para favoritar espécies.', 'error');
      return false;
    }
    try {
      const res = await fetch(`/api/fishes/${fishId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      
      setUser(prev => {
        if (!prev) return null;
        const favorites = prev.favorites || [];
        const isFav = favorites.includes(fishId);
        const updatedFavs = isFav 
          ? favorites.filter(id => id !== fishId)
          : [...favorites, fishId];
        return { ...prev, favorites: updatedFavs };
      });
      
      showToast(data.message);
      return data.isFavorited;
    } catch (error) {
      showToast(error.message || 'Erro ao favoritar', 'error');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, toast, showToast, login, register, logout, updateProfile, toggleFavorite }}>
      {children}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '🐠' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
