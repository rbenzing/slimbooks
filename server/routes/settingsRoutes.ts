// Settings routes for Slimbooks
// Handles application settings and project configuration endpoints

import { Router, Request, Response } from 'express';
import {
  getAllSettings,
  getSettingByKey,
  saveSetting,
  saveMultipleSettings
} from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/index.js';

const router: Router = Router();

// Public settings (no auth required)

// Get currency format settings (public for UI formatting)
router.get('/currency', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { settingsService } = await import('../services/SettingsService.js');
    const result = await settingsService.getSettingByKey('currency_format_settings');

    if (result) {
      res.json({ success: true, value: result });
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
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get company settings (public for UI display and invoice generation)
router.get('/company', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { settingsService } = await import('../services/SettingsService.js');
    const result = await settingsService.getSettingByKey('company_settings');

    if (result) {
      res.json({ success: true, value: result });
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
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get appearance settings (category-based)
router.get('/appearance', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    req.query.category = 'appearance';
    await getAllSettings(req, res, () => {});
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Save appearance settings (user-level, no admin required)
router.put('/appearance', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, error: 'Settings object is required' });
      return;
    }
    
    // Only allow appearance-related settings to be saved through this endpoint
    const allowedSettings = ['theme', 'invoice_template_preference', 'pdf_format_preference'];
    const filteredSettings: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(settings)) {
      if (allowedSettings.includes(key)) {
        filteredSettings[key] = { ...(value as Record<string, unknown>), category: 'appearance' };
      }
    }
    
    if (Object.keys(filteredSettings).length === 0) {
      res.status(400).json({ success: false, error: 'No valid appearance settings provided' });
      return;
    }
    
    await saveMultipleSettings({ body: { settings: filteredSettings } } as Request, res, () => {});
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get general settings (category-based)  
router.get('/general', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    req.query.category = 'general';
    await getAllSettings(req, res, () => {});
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get notification settings (specific key)
router.get('/notification', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { settingsService } = await import('../services/SettingsService.js');
    const result = await settingsService.getSettingByKey('notification_settings');

    if (result) {
      res.json({ success: true, settings: { notification_settings: result } });
    } else {
      // Return default notification settings
      res.json({
        success: true,
        settings: {
          notification_settings: {
            showToastNotifications: true,
            showSuccessToasts: true,
            showErrorToasts: true,
            showWarningToasts: true,
            showInfoToasts: true,
            toastDuration: 4000,
            toastPosition: 'bottom-right'
          }
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
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