// Settings routes for Slimbooks
// Handles application settings and project configuration endpoints

import { Router } from 'express';
import {
  getAllSettings,
  getSettingByKey,
  saveSetting,
  saveMultipleSettings
} from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/index.js';

const router = Router();

// Public settings (no auth required)

// Get currency format settings (public for UI formatting)
router.get('/currency_format_settings', async (_req, res) => {
  try {
    const { db } = await import('../models/index.js');
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('currency_format_settings');

    if (result?.value) {
      try {
        const parsedValue = JSON.parse(result.value);
        res.json({ success: true, value: parsedValue });
      } catch {
        res.json({ success: true, value: result.value });
      }
    } else {
      // Return default currency format settings
      res.json({
        success: true,
        value: {
          currency: 'USD',
          symbol: '$',
          position: 'before',
          decimal_places: 2,
          thousands_separator: ',',
          decimal_separator: '.'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company settings (public for UI display and invoice generation)
router.get('/company_settings', async (_req, res) => {
  try {
    const { db } = await import('../models/index.js');
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('company_settings');

    if (result?.value) {
      try {
        const parsedValue = JSON.parse(result.value);
        res.json({ success: true, value: parsedValue });
      } catch {
        res.json({ success: true, value: result.value });
      }
    } else {
      // Return default company settings
      res.json({
        success: true,
        value: {
          companyName: 'ClientBill Pro',
          ownerName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          email: '',
          phone: '',
          brandingImage: ''
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settings operations (require auth)

// Get all settings or filter by category
router.get('/', requireAuth, getAllSettings);

// Get individual setting by key
router.get('/:key', requireAuth, getSettingByKey);

// Save individual setting
router.post('/', requireAuth, requireAdmin, saveSetting);

// Save multiple settings at once
router.put('/', requireAuth, requireAdmin, saveMultipleSettings);

// Note: Project settings are handled in separate routes at /api/project-settings

export default router;
