# 🐠 FishHub

**FishHub** é a plataforma definitiva para amantes de aquarismo. O projeto integra um catálogo completo de peixes ornamentais, um diário detalhado para gestão e monitoramento de aquários pessoais e um fórum ativo para discussão de temas como doenças, plantas, equipamentos e dicas para iniciantes.

---

## 👥 Integrantes do Grupo

- Ana Clara Francisca Barbosa - 22.2.8096
- Ewerton Gomes Barcia - 22.2.8066
- Gustavo Guimarães de Oliveira Dias - 22.2.8020

## 🚀 Funcionalidades

### 🔐 Autenticação & Perfis
- Registro de nova conta e Login seguro com tokens JWT.
- Edição de perfil (nome, e-mail e senha).
- Estatísticas do usuário (total de publicações e curtidas recebidas no fórum).
- Lista de peixes favoritos vinculada diretamente ao perfil do usuário.

### 🐟 Catálogo de Peixes Ornamentais
- Listagem de espécies com busca em tempo real.
- Filtros por categoria de água, temperamento, faixa de pH e de temperatura.
- Ficha técnica completa de cada espécie (dieta, expectativa de vida, compatibilidade, parâmetros ideais e contador de visualizações).
- Opção para favoritar espécies diretamente a partir do catálogo.
- Permissão para que criadores e administradores adicionem, editem ou removam espécies.

### 💬 Fórum de Aquarismo
- Criação e visualização de tópicos de discussão com filtragem por categorias.
- Sistema de curtidas (Likes) em publicações.
- Seção de comentários/respostas nos tópicos com controle de permissão para remoção de comentários.

### 📅 Diário e Gestão de Aquários
- Cadastro de aquários contendo informações como tipo (Água Doce ou Marinho), volume em litros, dimensões, substrato, data de montagem e notas.
- **Habitantes**: Vinculação de espécies cadastradas no catálogo aos aquários do usuário.
- **Equipamentos**: Registro de filtros, aquecedores, iluminação, CO2, etc.
- **Parâmetros**: Histórico e controle de medições de PH, temperatura, amônia, nitrito, nitrato, GH e KH.
- **Manutenções**: Registro de datas e descrições para limpezas, TPAs (Troca Parcial de Água), podas e podas com opção de fotos.
- **Alimentações**: Controle de cronograma de alimentação (data, horário, tipo de ração e quantidade).
- **Galeria de Fotos**: Linha do tempo visual do aquário.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js**: Ambiente de execução Javascript.
- **Express**: Framework web minimalista para rotas e APIs.
- **MongoDB**: Banco de dados NoSQL para persistência.
- **JSON Web Tokens (JWT)**: Segurança nas requisições protegidas.
- **Multer**: Processamento de upload de imagens.
- **Bcrypt.js**: Criptografia de senhas.

### Frontend
- **React (v19)**: Biblioteca SPA de interfaces dinâmicas.
- **Vite**: Build tool rápido de desenvolvimento.
- **React Router DOM (v7)**: Controle de rotas e navegação.
- **CSS Vanilla**: Estilização rica, responsiva e performática.

---

## 💻 Como Rodar o Projeto

### 📋 Pré-requisitos
- Node.js instalado (v18 ou superior).
- Servidor MongoDB rodando localmente (`mongodb://127.0.0.1:27017`) ou uma string de conexão do MongoDB Atlas.

---

### 1️⃣ Configuração do Banco de Dados & Backend

1. Entre no diretório do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie e configure o arquivo `.env` com as seguintes chaves (exemplo padrão já incluso):
   ```env
   PORT=5005
   MONGO_URI=mongodb://127.0.0.1:27017
   DB_NAME=fishhub
   JWT_SECRET=admin123
   ```

4. Alimente o banco de dados com a carga inicial de peixes e postagens (Seed):
   ```bash
   npm run seed
   ```
   *(Nota: O script `seed.js` preencherá dados iniciais para visualização no catálogo).*

5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

---

### 2️⃣ Configuração do Frontend

1. Entre no diretório do frontend:
   ```bash
   cd ../frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor do Vite localmente:
   ```bash
   npm run dev
   ```
