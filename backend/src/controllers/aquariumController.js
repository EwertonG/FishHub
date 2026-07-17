import { ObjectId } from 'mongodb';
import { Aquarium } from '../models/Aquarium.js';

export const aquariumController = {
  async getAllAquariums(req, res) {
    try {
      const aquariums = await Aquarium.findAllByUserId(req.user.id);
      res.json(aquariums);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao obter lista de aquários.', error: error.message });
    }
  },

  async getAquariumDetails(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de aquário inválido.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado a este aquário.' });
      }

      res.json(aquarium);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao obter detalhes do aquário.', error: error.message });
    }
  },

  async createAquarium(req, res) {
    const { name, imageUrl, type, volume, dimensions, setupDate, substrate, notes } = req.body;
    if (!name || !type || !volume) {
      return res.status(400).json({ message: 'Nome, tipo e volume são campos obrigatórios.' });
    }

    try {
      const newAquarium = await Aquarium.create({
        userId: req.user.id,
        name,
        imageUrl,
        type,
        volume,
        dimensions,
        setupDate,
        substrate,
        notes
      });
      res.status(201).json(newAquarium);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar aquário.', error: error.message });
    }
  },

  async updateAquarium(req, res) {
    const { id } = req.params;
    const { name, imageUrl, type, volume, dimensions, setupDate, substrate, notes } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de aquário inválido.' });
    }

    if (!name || !type || !volume) {
      return res.status(400).json({ message: 'Nome, tipo e litragem são obrigatórios.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão para editar este aquário.' });
      }

      const updatedAquarium = await Aquarium.update(id, {
        name,
        imageUrl,
        type,
        volume,
        dimensions,
        setupDate,
        substrate,
        notes
      });

      res.json(updatedAquarium);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar dados do aquário.', error: error.message });
    }
  },

  async deleteAquarium(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de aquário inválido.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Sem permissão para remover este aquário.' });
      }

      await Aquarium.delete(id);
      res.json({ message: 'Aquário excluído com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir aquário.', error: error.message });
    }
  },

  async addInhabitant(req, res) {
    const { id } = req.params;
    const { type, speciesId, speciesName, quantity, acquisitionDate, notes } = req.body;

    if (!type || !speciesName || !quantity) {
      return res.status(400).json({ message: 'Tipo, nome da espécie e quantidade são obrigatórios.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newInhabitant = await Aquarium.addInhabitant(id, {
        type,
        speciesId,
        speciesName,
        quantity,
        acquisitionDate,
        notes
      });

      res.status(201).json(newInhabitant);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar habitante.', error: error.message });
    }
  },

  async deleteInhabitant(req, res) {
    const { id, inhabitantId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const inhabitant = aquarium.inhabitants && aquarium.inhabitants.find(i => i._id.toString() === inhabitantId);
      if (!inhabitant) {
        return res.status(404).json({ message: 'Habitante não encontrado.' });
      }

      await Aquarium.deleteInhabitant(id, inhabitantId);
      res.json({ message: 'Habitante removido com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover habitante.', error: error.message });
    }
  },

  async addEquipment(req, res) {
    const { id } = req.params;
    const { name, type, specs, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nome e tipo de equipamento são obrigatórios.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newEquipment = await Aquarium.addEquipment(id, {
        name,
        type,
        specs,
        notes
      });

      res.status(201).json(newEquipment);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar equipamento.', error: error.message });
    }
  },

  async deleteEquipment(req, res) {
    const { id, equipmentId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const equip = aquarium.equipment && aquarium.equipment.find(e => e._id.toString() === equipmentId);
      if (!equip) {
        return res.status(404).json({ message: 'Equipamento não encontrado.' });
      }

      await Aquarium.deleteEquipment(id, equipmentId);
      res.json({ message: 'Equipamento removido com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover equipamento.', error: error.message });
    }
  },

  async addParameters(req, res) {
    const { id } = req.params;
    const { date, temperature, ph, ammonia, nitrite, nitrate, gh, kh, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Data da medição é obrigatória.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newMeasurement = await Aquarium.addParameters(id, {
        date,
        temperature,
        ph,
        ammonia,
        nitrite,
        nitrate,
        gh,
        kh,
        notes
      });

      res.status(201).json(newMeasurement);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar parâmetros.', error: error.message });
    }
  },

  async deleteParameters(req, res) {
    const { id, parameterId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const param = aquarium.parameters && aquarium.parameters.find(p => p._id.toString() === parameterId);
      if (!param) {
        return res.status(404).json({ message: 'Medição não encontrada.' });
      }

      await Aquarium.deleteParameters(id, parameterId);
      res.json({ message: 'Medição removida com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover medição.', error: error.message });
    }
  },

  async addMaintenance(req, res) {
    const { id } = req.params;
    const { date, type, description, imageUrl } = req.body;

    if (!date || !type || !description) {
      return res.status(400).json({ message: 'Data, tipo e descrição são obrigatórios.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newMaintenance = await Aquarium.addMaintenance(id, {
        date,
        type,
        description,
        imageUrl
      });

      res.status(201).json(newMaintenance);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar manutenção.', error: error.message });
    }
  },

  async deleteMaintenance(req, res) {
    const { id, maintenanceId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const maint = aquarium.maintenances && aquarium.maintenances.find(m => m._id.toString() === maintenanceId);
      if (!maint) {
        return res.status(404).json({ message: 'Manutenção não encontrada.' });
      }

      await Aquarium.deleteMaintenance(id, maintenanceId);
      res.json({ message: 'Manutenção removida com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover manutenção.', error: error.message });
    }
  },

  async addFeeding(req, res) {
    const { id } = req.params;
    const { date, time, foodType, quantity, notes } = req.body;

    if (!date || !foodType) {
      return res.status(400).json({ message: 'Data e tipo de alimento são obrigatórios.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newFeeding = await Aquarium.addFeeding(id, {
        date,
        time,
        foodType,
        quantity,
        notes
      });

      res.status(201).json(newFeeding);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar alimentação.', error: error.message });
    }
  },

  async deleteFeeding(req, res) {
    const { id, feedingId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const feeding = aquarium.feedings && aquarium.feedings.find(f => f._id.toString() === feedingId);
      if (!feeding) {
        return res.status(404).json({ message: 'Alimentação não encontrada.' });
      }

      await Aquarium.deleteFeeding(id, feedingId);
      res.json({ message: 'Alimentação removida com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover alimentação.', error: error.message });
    }
  },

  async addGalleryPhoto(req, res) {
    const { id } = req.params;
    const { imageUrl, caption, date } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'URL da imagem é obrigatória.' });
    }

    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const newPhoto = await Aquarium.addGalleryPhoto(id, {
        imageUrl,
        caption,
        date
      });

      res.status(201).json(newPhoto);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar foto.', error: error.message });
    }
  },

  async deleteGalleryPhoto(req, res) {
    const { id, photoId } = req.params;
    try {
      const aquarium = await Aquarium.findById(id);
      if (!aquarium) {
        return res.status(404).json({ message: 'Aquário não encontrado.' });
      }

      if (aquarium.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const photo = aquarium.gallery && aquarium.gallery.find(p => p._id.toString() === photoId);
      if (!photo) {
        return res.status(404).json({ message: 'Foto não encontrada.' });
      }

      await Aquarium.deleteGalleryPhoto(id, photoId);
      res.json({ message: 'Foto removida com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover foto.', error: error.message });
    }
  }
};
