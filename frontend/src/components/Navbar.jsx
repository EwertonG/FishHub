import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.removeItem('fishhub_theme');
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="logo-link">
          <span>🐠</span>
          <span>FishHub</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
              Início
            </Link>
          </li>
          <li>
            <Link to="/catalog" className={`nav-item ${isActive('/catalog') ? 'active' : ''}`}>
              Catálogo
            </Link>
          </li>
          <li>
            <Link to="/forum" className={`nav-item ${isActive('/forum') ? 'active' : ''}`}>
              Fórum
            </Link>
          </li>
          {user && (
            <>
              <li>
                <Link to="/aquariums" className={`nav-item ${isActive('/aquariums') ? 'active' : ''}`}>
                  Meus Aquários
                </Link>
              </li>
              <li>
                <Link to="/fishes/new" className={`nav-item ${isActive('/fishes/new') ? 'active' : ''}`}>
                  + Cadastrar Peixe
                </Link>
              </li>
              <li>
                <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                  Meu Perfil
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {user ? (
            <div className="flex-gap">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Olá, {user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                Sair
              </button>
            </div>
          ) : (
            <div className="flex-gap">
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Entrar
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
