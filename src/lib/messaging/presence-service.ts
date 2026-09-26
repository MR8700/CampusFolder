import { prisma } from '@/lib/prisma';
import { realTimeBus } from './event-bus';

export class PresenceService {
  /**
   * Heartbeat ping to maintain online state
   */
  static async heartbeat(userId: string, customStatus?: string) {
    const presence = await prisma.userPresence.upsert({
      where: { userId },
      update: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        ...(customStatus !== undefined ? { customStatus } : {}),
      },
      create: {
        userId,
        status: 'ONLINE',
        lastSeenAt: new Date(),
        customStatus: customStatus || null,
      },
    });

    realTimeBus.emit('presence.updated', {
      userId,
      status: 'ONLINE',
      lastSeenAt: presence.lastSeenAt,
    });

    return presence;
  }

  /**
   * Set explicit status (e.g. IN_CALL, AWAY, OFFLINE)
   */
  static async setStatus(userId: string, status: string, currentCallId?: string) {
    const presence = await prisma.userPresence.upsert({
      where: { userId },
      update: {
        status,
        lastSeenAt: new Date(),
        currentCallId: currentCallId ?? null,
      },
      create: {
        userId,
        status,
        lastSeenAt: new Date(),
        currentCallId: currentCallId ?? null,
      },
    });

    realTimeBus.emit('presence.updated', {
      userId,
      status,
      lastSeenAt: presence.lastSeenAt,
      currentCallId,
    });

    return presence;
  }

  /**
   * Query status of a single user (resolves OFFLINE if lastSeen > 90 seconds ago)
   */
  static async getUserPresence(userId: string) {
    const presence = await prisma.userPresence.findUnique({
      where: { userId },
    });

    if (!presence) {
      return {
        userId,
        status: 'OFFLINE',
        isOnline: false,
        lastSeenAt: null,
      };
    }

    const elapsedMs = Date.now() - new Date(presence.lastSeenAt).getTime();
    const isOnline = presence.status !== 'OFFLINE' && elapsedMs < 90000;

    return {
      userId,
      status: isOnline ? presence.status : 'OFFLINE',
      isOnline,
      lastSeenAt: presence.lastSeenAt,
      customStatus: presence.customStatus,
      currentCallId: presence.currentCallId,
    };
  }

  /**
   * Query multiple users presence in batch
   */
  static async getBatchPresence(userIds: string[]) {
    const presences = await prisma.userPresence.findMany({
      where: { userId: { in: userIds } },
    });

    const now = Date.now();
    const map: Record<string, any> = {};

    for (const p of presences) {
      const elapsed = now - new Date(p.lastSeenAt).getTime();
      const isOnline = p.status !== 'OFFLINE' && elapsed < 90000;
      map[p.userId] = {
        status: isOnline ? p.status : 'OFFLINE',
        isOnline,
        lastSeenAt: p.lastSeenAt,
      };
    }

    return map;
  }
}
