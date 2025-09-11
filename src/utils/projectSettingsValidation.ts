// Project Settings Validation utilities
// Separated from types to avoid circular dependencies with main types index

import { z } from 'zod';
import type { ProjectSettings, GoogleOAuthSettings, StripeSettings, EmailServiceSettings, SecurityConfig } from '@/types/domain/settings.types';

// Zod schemas for runtime validation of project settings
export const GoogleOAuthSchema = z.object({
  enabled: z.boolean(),
  client_id: z.string(),
  client_secret: z.string().optional(),
  configured: z.boolean()
});

export const StripeSchema = z.object({
  enabled: z.boolean(),
  publishable_key: z.string(),
  secret_key: z.string().optional(),
  configured: z.boolean()
});

export const EmailServiceSchema = z.object({
  enabled: z.boolean(),
  smtp_host: z.string(),
  smtp_port: z.number().int().min(1).max(65535),
  smtp_user: z.string(),
  smtp_pass: z.string().optional(),
  email_from: z.string().email().optional().or(z.literal('')),
  configured: z.boolean()
});

export const SecurityConfigSchema = z.object({
  require_email_verification: z.boolean(),
  max_failed_login_attempts: z.number().int().min(1).max(50),
  account_lockout_duration: z.number().int().min(0)
});

export const ProjectSettingsSchema = z.object({
  google_oauth: GoogleOAuthSchema.optional(),
  stripe: StripeSchema.optional(),
  email: EmailServiceSchema.optional(),
  security: SecurityConfigSchema.optional()
});

// Helper function to validate and parse project settings
export function validateProjectSettings(data: unknown): ProjectSettings {
  try {
    return ProjectSettingsSchema.parse(data) as ProjectSettings;
  } catch (error) {
    console.error('ProjectSettings validation failed:', error);
    throw new Error(`Invalid project settings data: ${error instanceof z.ZodError ? error.message : 'Unknown error'}`);
  }
}

// Helper function for safe parsing with defaults
export function parseProjectSettingsWithDefaults(data: unknown): ProjectSettings {
  const defaultSettings: ProjectSettings = {
    google_oauth: {
      enabled: false,
      client_id: '',
      client_secret: '',
      configured: false
    },
    stripe: {
      enabled: false,
      publishable_key: '',
      secret_key: '',
      configured: false
    },
    email: {
      enabled: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_pass: '',
      email_from: '',
      configured: false
    },
    security: {
      require_email_verification: true,
      max_failed_login_attempts: 5,
      account_lockout_duration: 1800000
    }
  };

  try {
    const parsed = ProjectSettingsSchema.parse(data);
    // Merge parsed data with defaults to ensure all required fields are present
    return {
      google_oauth: { ...defaultSettings.google_oauth, ...parsed.google_oauth },
      stripe: { ...defaultSettings.stripe, ...parsed.stripe },
      email: { ...defaultSettings.email, ...parsed.email },
      security: { ...defaultSettings.security, ...parsed.security }
    };
  } catch (error) {
    console.warn('Using default settings due to validation error:', error);
    return defaultSettings;
  }
}