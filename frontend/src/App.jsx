import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import FishDetails from './pages/FishDetails';
import FishForm from './pages/FishForm';
import Forum from './pages/Forum';
import PostDetails from './pages/PostDetails';
import Profile from './pages/Profile';
import AquariumsList from './pages/AquariumsList';
import AquariumForm from './pages/AquariumForm';
import AquariumDetails from './pages/AquariumDetails';


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verificando autenticação...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: '1 0 auto' }}>
            <Routes>
              
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/fishes/:id" element={<FishDetails />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/posts/:id" element={<PostDetails />} />

              
              <Route
                path="/fishes/new"
                element={
                  <PrivateRoute>
                    <FishForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/fishes/:id/edit"
                element={
                  <PrivateRoute>
                    <FishForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              
              <Route
                path="/aquariums"
                element={
                  <PrivateRoute>
                    <AquariumsList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/aquariums/new"
                element={
                  <PrivateRoute>
                    <AquariumForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/aquariums/:id"
                element={
                  <PrivateRoute>
                    <AquariumDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/aquariums/:id/edit"
                element={
                  <PrivateRoute>
                    <AquariumForm />
                  </PrivateRoute>
                }
              />

              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
