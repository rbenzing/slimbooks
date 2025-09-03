// Settings controller for Slimbooks
// Handles application settings and project configuration

import { settingsService } from '../services/SettingsService.js';
import { 
  AppError, 
  NotFoundError, 
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all settings or filter by category
 */
export const getAllSettings = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const settings = await settingsService.getAllSettings(category);
  res.json({ success: true, settings });
});

/**
 * Get individual setting by key
 */
export const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const value = await settingsService.getSettingByKey(key);
  res.json({ success: true, value });
});

/**
 * Save individual setting
 */
export const saveSetting = asyncHandler(async (req, res) => {
  const { key, value, category = 'general' } = req.body;
  
  if (!key) {
    throw new ValidationError('Setting key is required');
  }
  
  await settingsService.saveSetting(key, value, category);
  res.json({ success: true });
});

/**
 * Save multiple settings at once
 */
export const saveMultipleSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings object is required');
  }

  await settingsService.saveMultipleSettings(settings);
  res.json({ success: true });
});

/**
 * Get project configuration (combines .env defaults with database overrides)
 */
export const getProjectSettings = asyncHandler(async (req, res) => {
  const projectSettings = await settingsService.getProjectSettings();
  res.json({ success: true, settings: projectSettings });
});

/**
 * Update project settings
 */
export const updateProjectSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings object is required');
  }

  await settingsService.updateProjectSettings(settings);
  res.json({ success: true });
});
