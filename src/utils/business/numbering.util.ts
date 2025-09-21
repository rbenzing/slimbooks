interface NumberingSettings {
  prefix: string;
  startNumber: number;
  paddingLength: number;
  includeYear: boolean;
  resetOnNewYear: boolean;
}

const DEFAULT_INVOICE_SETTINGS: NumberingSettings = {
  prefix: 'INV',
  startNumber: 1,
  paddingLength: 4,
  includeYear: true,
  resetOnNewYear: true
};

const DEFAULT_EXPENSE_SETTINGS: NumberingSettings = {
  prefix: 'EXP',
  startNumber: 1,
  paddingLength: 4,
  includeYear: true,
  resetOnNewYear: true
};

const DEFAULT_PAYMENT_SETTINGS: NumberingSettings = {
  prefix: 'PAY',
  startNumber: 1,
  paddingLength: 4,
  includeYear: true,
  resetOnNewYear: true
};

export const getNumberingSettings = async (type: 'invoice' | 'expense' | 'payment'): Promise<NumberingSettings> => {
  try {
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      const settings = await sqliteService.getSetting(`${type}_numbering_settings`) as NumberingSettings;
      if (settings) {
        const defaults = type === 'invoice' ? DEFAULT_INVOICE_SETTINGS :
                        type === 'expense' ? DEFAULT_EXPENSE_SETTINGS :
                        DEFAULT_PAYMENT_SETTINGS;

        return {
          prefix: settings.prefix || defaults.prefix,
          startNumber: settings.startNumber ?? defaults.startNumber,
          paddingLength: settings.paddingLength ?? defaults.paddingLength,
          includeYear: settings.includeYear ?? defaults.includeYear,
          resetOnNewYear: settings.resetOnNewYear ?? defaults.resetOnNewYear
        };
      }
    }
  } catch (error) {
    console.error(`Error loading ${type} numbering settings:`, error);
  }

  return type === 'invoice' ? DEFAULT_INVOICE_SETTINGS :
         type === 'expense' ? DEFAULT_EXPENSE_SETTINGS :
         DEFAULT_PAYMENT_SETTINGS;
};

export const saveNumberingSettings = async (
  type: 'invoice' | 'expense' | 'payment',
  settings: NumberingSettings
): Promise<void> => {
  try {
    const { sqliteService } = await import('@/services/sqlite.svc');

    if (sqliteService.isReady()) {
      await sqliteService.setSetting(`${type}_numbering_settings`, settings, 'general');
    }
  } catch (error) {
    console.error(`Error saving ${type} numbering settings:`, error);
  }
};

export const generateNumber = (
  settings: NumberingSettings,
  sequence: number,
  year?: number
): string => {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(settings.paddingLength, '0');

  if (settings.includeYear) {
    return `${settings.prefix}-${currentYear}-${paddedSequence}`;
  }

  return `${settings.prefix}-${paddedSequence}`;
};

export const parseNumber = (number: string): {
  prefix?: string;
  year?: number;
  sequence?: number;
} => {
  // Pattern with year: PREFIX-YYYY-NNNN
  const patternWithYear = /^([A-Za-z]+)-(\d{4})-(\d+)$/;
  const matchWithYear = number.match(patternWithYear);

  if (matchWithYear) {
    return {
      prefix: matchWithYear[1],
      year: parseInt(matchWithYear[2], 10),
      sequence: parseInt(matchWithYear[3], 10)
    };
  }

  // Pattern without year: PREFIX-NNNN
  const patternWithoutYear = /^([A-Za-z]+)-(\d+)$/;
  const matchWithoutYear = number.match(patternWithoutYear);

  if (matchWithoutYear) {
    return {
      prefix: matchWithoutYear[1],
      sequence: parseInt(matchWithoutYear[2], 10)
    };
  }

  return {};
};

export const getNextNumber = async (
  type: 'invoice' | 'expense' | 'payment',
  lastNumber?: string
): Promise<string> => {
  const settings = await getNumberingSettings(type);
  const currentYear = new Date().getFullYear();

  if (!lastNumber) {
    return generateNumber(settings, settings.startNumber, currentYear);
  }

  const parsed = parseNumber(lastNumber);

  if (settings.resetOnNewYear && parsed.year && parsed.year < currentYear) {
    return generateNumber(settings, settings.startNumber, currentYear);
  }

  if (parsed.sequence) {
    const nextSequence = parsed.sequence + 1;
    const yearToUse = settings.includeYear ? currentYear : undefined;
    return generateNumber(settings, nextSequence, yearToUse);
  }

  return generateNumber(settings, settings.startNumber, currentYear);
};