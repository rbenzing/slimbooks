// Template routes for Slimbooks
// Handles invoice template management endpoints

import { Router } from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/templateController.js';
import { requireAuth, requireAdmin } from '../middleware/index.js';

const router = Router();

// Get all templates
router.get('/', requireAuth, getAllTemplates);

// Get template by ID
router.get('/:id', requireAuth, getTemplateById);

// Create new template
router.post('/', requireAuth, createTemplate);

// Update template
router.put('/:id', requireAuth, updateTemplate);

// Delete template
router.delete('/:id', requireAuth, deleteTemplate);

export default router;
