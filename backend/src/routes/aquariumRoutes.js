import express from 'express';
import { aquariumController } from '../controllers/aquariumController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, aquariumController.getAllAquariums);
router.get('/:id', authMiddleware, aquariumController.getAquariumDetails);
router.post('/', authMiddleware, aquariumController.createAquarium);
router.put('/:id', authMiddleware, aquariumController.updateAquarium);
router.delete('/:id', authMiddleware, aquariumController.deleteAquarium);

router.post('/:id/inhabitants', authMiddleware, aquariumController.addInhabitant);
router.delete('/:id/inhabitants/:inhabitantId', authMiddleware, aquariumController.deleteInhabitant);

router.post('/:id/equipment', authMiddleware, aquariumController.addEquipment);
router.delete('/:id/equipment/:equipmentId', authMiddleware, aquariumController.deleteEquipment);

router.post('/:id/parameters', authMiddleware, aquariumController.addParameters);
router.delete('/:id/parameters/:parameterId', authMiddleware, aquariumController.deleteParameters);

router.post('/:id/maintenances', authMiddleware, aquariumController.addMaintenance);
router.delete('/:id/maintenances/:maintenanceId', authMiddleware, aquariumController.deleteMaintenance);

router.post('/:id/feedings', authMiddleware, aquariumController.addFeeding);
router.delete('/:id/feedings/:feedingId', authMiddleware, aquariumController.deleteFeeding);

router.post('/:id/gallery', authMiddleware, aquariumController.addGalleryPhoto);
router.delete('/:id/gallery/:photoId', authMiddleware, aquariumController.deleteGalleryPhoto);

export default router;
