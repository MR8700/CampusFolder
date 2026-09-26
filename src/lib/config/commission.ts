import { prisma } from '@/lib/prisma';

export interface CommissionSettings {
  platformCommissionPercent: number; // e.g. 40 (%)
  authorRoyaltyPercent: number;       // e.g. 60 (%)
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  platformCommissionPercent: 40,
  authorRoyaltyPercent: 60,
};

/**
 * Retrieves the centralized platform commission settings.
 * Default is strictly 40% platform fee, 60% contributor royalties.
 */
export async function getCommissionSettings(): Promise<CommissionSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    });

    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        const platformCommissionPercent = Math.round(parsed);
        const authorRoyaltyPercent = 100 - platformCommissionPercent;
        return {
          platformCommissionPercent,
          authorRoyaltyPercent,
          updatedAt: setting.updatedAt.toISOString(),
          updatedBy: setting.updatedBy || 'ADMIN',
        };
      }
    }
  } catch (error) {
    console.error('Error fetching commission settings from database:', error);
  }

  return DEFAULT_COMMISSION_SETTINGS;
}

/**
 * Centralized update function for admins to configure platform monetization rates.
 */
export async function updateCommissionSettings(
  platformCommissionPercent: number,
  updatedBy: string = 'ADMIN'
): Promise<CommissionSettings> {
  const safePlatformRate = Math.max(0, Math.min(100, Math.round(platformCommissionPercent)));
  const safeAuthorRate = 100 - safePlatformRate;

  const setting = await prisma.systemSetting.upsert({
    where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    update: {
      value: String(safePlatformRate),
      updatedBy,
      description: 'Taux de commission de la plateforme Campus Folder sur chaque monétisation (%)',
    },
    create: {
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: String(safePlatformRate),
      updatedBy,
      description: 'Taux de commission de la plateforme Campus Folder sur chaque monétisation (%)',
    },
  });

  return {
    platformCommissionPercent: safePlatformRate,
    authorRoyaltyPercent: safeAuthorRate,
    updatedAt: setting.updatedAt.toISOString(),
    updatedBy: setting.updatedBy || updatedBy,
  };
}

/**
 * Calculates exact FCFA revenue split between platform and author.
 */
export function calculateRevenueSplit(
  price: number,
  platformCommissionPercent: number = 40
) {
  const safePrice = Math.max(0, Math.round(price));
  const rate = Math.max(0, Math.min(100, platformCommissionPercent)) / 100;
  const platformShare = Math.round(safePrice * rate);
  const authorShare = safePrice - platformShare;

  return {
    price: safePrice,
    platformShare,
    authorShare,
    platformCommissionPercent,
    authorRoyaltyPercent: 100 - platformCommissionPercent,
  };
}
