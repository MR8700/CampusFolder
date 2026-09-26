import { prisma } from '@/lib/prisma';
import { MessagingService } from './messaging-service';

export class ResourceSharingService {
  /**
   * Share an academic resource into a conversation
   */
  static async shareResourceToConversation(
    userId: string,
    conversationId: string,
    resourceId: string,
    messageText?: string
  ) {
    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        accessPolicy: true,
        author: { include: { profile: true } },
        faculty: true,
      },
    });

    if (!resource) {
      throw new Error('Ressource académique introuvable.');
    }

    if (resource.isArchived || resource.visibility === 'PRIVATE') {
      throw new Error('Cette ressource ne peut pas être partagée.');
    }

    const isPaid = resource.accessPolicy?.mode === 'PAID';
    const priceAmount = resource.accessPolicy?.priceAmount || 0;

    // Check if the sharer owns the resource or has an entitlement
    const isAuthor = resource.authorId === userId;
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId,
        resourceId,
        isRevoked: false,
        tokenExpiresAt: { gt: new Date() },
      },
    });

    const accessSnapshot = {
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      facultyName: resource.faculty.name,
      authorId: resource.authorId,
      authorName: resource.author.profile?.displayName || 'Contributeur',
      badgeQuality: resource.badgeQuality || 'Vérifié',
      isPaid,
      priceAmount,
      currency: resource.accessPolicy?.currency || 'XOF',
      mode: resource.accessPolicy?.mode || 'FREE',
      thumbnailUrl: resource.thumbnailUrl,
      pageCount: resource.pageCount,
    };

    const text =
      messageText?.trim() ||
      `📚 ${isPaid ? 'Ressource recommandée' : 'Partage du document'} : ${resource.title}`;

    const message = await MessagingService.sendMessage(userId, {
      conversationId,
      type: 'RESOURCE',
      text,
      resourceId: resource.id,
      metadata: {
        resourceSnapshot: accessSnapshot,
      },
    });

    return {
      message,
      resource: accessSnapshot,
    };
  }

  /**
   * Check access rights of a user for a shared resource in chat
   */
  static async checkResourceAccess(userId: string, resourceId: string) {
    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        accessPolicy: true,
        author: true,
      },
    });

    if (!resource) {
      return { canAccess: false, reason: 'NOT_FOUND' };
    }

    // 1. Author always has access
    if (resource.authorId === userId) {
      return { canAccess: true, isAuthor: true, mode: 'AUTHOR' };
    }

    // 2. Free resources are open to all students
    const isPaid = resource.accessPolicy?.mode === 'PAID';
    if (!isPaid) {
      return { canAccess: true, isAuthor: false, mode: 'FREE' };
    }

    // 3. Paid resources require active entitlement
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId,
        resourceId,
        isRevoked: false,
        tokenExpiresAt: { gt: new Date() },
      },
    });

    if (entitlement) {
      return {
        canAccess: true,
        isAuthor: false,
        mode: 'PURCHASED',
        downloadToken: entitlement.downloadToken,
      };
    }

    return {
      canAccess: false,
      isAuthor: false,
      mode: 'PAYMENT_REQUIRED',
      priceAmount: resource.accessPolicy?.priceAmount || 500,
      currency: resource.accessPolicy?.currency || 'XOF',
    };
  }
}
