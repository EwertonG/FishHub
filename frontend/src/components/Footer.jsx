import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} FishHub. Desenvolvido com carinho para aquaristas.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.7 }}>
          Utilizando o driver oficial do MongoDB para operações nativas e eficientes de banco de dados.
        </p>
      </div>
    </footer>
  );
}
