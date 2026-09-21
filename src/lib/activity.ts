import { prisma } from './prisma';

export interface LogActivityParams {
  userId: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'PROFILE_UPDATE'
    | 'PASSWORD_CHANGED'
    | 'SETTINGS_UPDATED'
    | 'RESOURCE_PURCHASED'
    | 'RESOURCE_PUBLISHED'
    | 'REMINDER_SENT'
    | 'POINTS_EARNED';
  title: string;
  category?: 'SECURITY' | 'ACADEMIC' | 'COMMERCE' | 'SETTINGS' | 'GENERAL';
  metadata?: any;
  ipAddress?: string;
}

export async function logUserActivity({
  userId,
  action,
  title,
  category = 'GENERAL',
  metadata,
  ipAddress,
}: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        title,
        category,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    return null;
  }
}
