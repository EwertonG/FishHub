import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fishhub_key_12345');
    
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
