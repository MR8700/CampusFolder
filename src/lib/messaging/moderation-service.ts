import { prisma } from '@/lib/prisma';

export class ModerationService {
  /**
   * Block a user
   */
  static async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new Error('Vous ne pouvez pas vous bloquer vous-même.');
    }

    const block = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {
        reason: reason || null,
        createdAt: new Date(),
      },
      create: {
        blockerId,
        blockedId,
        reason: reason || null,
      },
    });

    return block;
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: string, blockedId: string) {
    await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });
    return { success: true };
  }

  /**
   * Report a message for moderation review
   */
  static async reportMessage(
    reporterId: string,
    messageId: string,
    reason: string,
    description?: string
  ) {
    const report = await prisma.messageReport.create({
      data: {
        reporterId,
        messageId,
        reason,
        description: description || null,
        status: 'PENDING',
      },
    });

    // Also record in ActivityLog for compliance audit
    await prisma.activityLog.create({
      data: {
        userId: reporterId,
        action: 'MESSAGE_REPORTED',
        title: `Message signalé pour motif : ${reason}`,
        category: 'SECURITY',
        metadata: JSON.stringify({ messageId, reason }),
      },
    });

    return report;
  }
}
