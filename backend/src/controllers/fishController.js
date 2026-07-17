import { ObjectId } from 'mongodb';
import { Fish } from '../models/Fish.js';

function phPhFormat(val) {
  return String(val).replace(',', '.');
}

export const fishController = {
  async getAllFishes(req, res) {
    const { search, category, temperament, minPh, maxPh, minTemp, maxTemp, sortBy } = req.query;
    try {
      const fishes = await Fish.findAll({
        search,
        category,
        temperament,
        minPh,
        maxPh,
        minTemp,
        maxTemp,
        sortBy
      });
      res.json(fishes);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao listar peixes.', error: error.message });
    }
  },

  async getFishDetails(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    try {
      const fish = await Fish.findByIdAndIncrementViews(id);
      if (!fish) {
        return res.status(404).json({ message: 'Espécie não encontrada.' });
      }
      res.json(fish);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao obter detalhes do peixe.', error: error.message });
    }
  },

  async createFish(req, res) {
    const {
      commonName,
      scientificName,
      category,
      temperament,
      phMin,
      phMax,
      tempMin,
      tempMax,
      averageSize,
      lifespan,
      diet,
      compatibility,
      imageUrl,
      description
    } = req.body;

    if (!commonName || !scientificName || !category) {
      return res.status(400).json({ message: 'Nome comum, científico e categoria são obrigatórios.' });
    }

    try {
      let formattedCompatibility = [];
      if (Array.isArray(compatibility)) {
        formattedCompatibility = compatibility;
      } else if (typeof compatibility === 'string') {
        formattedCompatibility = compatibility.split(',').map(item => item.trim()).filter(Boolean);
      }

      const newFish = await Fish.create({
        commonName,
        scientificName,
        category,
        temperament: temperament || 'Pacífico',
        phMin: phMin ? parseFloat(phPhFormat(phMin)) : 7.0,
        phMax: phMax ? parseFloat(phPhFormat(phMax)) : 7.0,
        tempMin: tempMin ? parseFloat(tempMin) : 24,
        tempMax: tempMax ? parseFloat(tempMax) : 26,
        averageSize: averageSize ? parseFloat(averageSize) : null,
        lifespan: lifespan ? parseInt(lifespan) : null,
        diet: diet || 'Onívoro',
        compatibility: formattedCompatibility,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: description || '',
        createdBy: req.user.id
      });

      res.status(201).json(newFish);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar espécie.', error: error.message });
    }
  },

  async updateFish(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    try {
      const fish = await Fish.findById(id);
      if (!fish) {
        return res.status(404).json({ message: 'Espécie não encontrada.' });
      }

      const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
      if (fish.createdBy.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta espécie.' });
      }

      const {
        commonName,
        scientificName,
        category,
        temperament,
        phMin,
        phMax,
        tempMin,
        tempMax,
        averageSize,
        lifespan,
        diet,
        compatibility,
        imageUrl,
        description
      } = req.body;

      if (!commonName || !scientificName || !category) {
        return res.status(400).json({ message: 'Nome comum, científico e categoria são obrigatórios.' });
      }

      let formattedCompatibility = [];
      if (Array.isArray(compatibility)) {
        formattedCompatibility = compatibility;
      } else if (typeof compatibility === 'string') {
        formattedCompatibility = compatibility.split(',').map(item => item.trim()).filter(Boolean);
      }

      const updatedFish = await Fish.update(id, {
        commonName,
        scientificName,
        category,
        temperament: temperament || 'Pacífico',
        phMin: phMin ? parseFloat(phPhFormat(phMin)) : 7.0,
        phMax: phMax ? parseFloat(phPhFormat(phMax)) : 7.0,
        tempMin: tempMin ? parseFloat(tempMin) : 24,
        tempMax: tempMax ? parseFloat(tempMax) : 26,
        averageSize: averageSize ? parseFloat(averageSize) : null,
        lifespan: lifespan ? parseInt(lifespan) : null,
        diet: diet || 'Onívoro',
        compatibility: formattedCompatibility,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: description || ''
      });

      res.json(updatedFish);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar espécie.', error: error.message });
    }
  },

  async deleteFish(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    try {
      const fish = await Fish.findById(id);
      if (!fish) {
        return res.status(404).json({ message: 'Espécie não encontrada.' });
      }

      const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
      if (fish.createdBy.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ message: 'Apenas o criador ou administradores podem excluir este registro.' });
      }

      await Fish.delete(id);
      res.json({ message: 'Espécie excluída com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir espécie.', error: error.message });
    }
  },

  async toggleFavorite(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    try {
      const fish = await Fish.findById(id);
      if (!fish) {
        return res.status(404).json({ message: 'Espécie não encontrada.' });
      }

      const result = await Fish.toggleFavorite(id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao processar favorito.', error: error.message });
    }
  }
};
