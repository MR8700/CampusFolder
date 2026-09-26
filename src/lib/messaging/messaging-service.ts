import { prisma } from '@/lib/prisma';
import { CreateConversationDto, SendMessageDto } from './types';
import { realTimeBus } from './event-bus';

export class MessagingService {
  /**
   * List all conversations for a given user with unread counts and last message
   */
  static async getUserConversations(userId: string) {
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        conversation: {
          include: {
            context: {
              include: {
                resource: {
                  include: {
                    faculty: true,
                    accessPolicy: true,
                  },
                },
              },
            },
            participants: {
              include: {
                user: {
                  include: {
                    profile: true,
                    presence: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { sentAt: 'desc' },
              include: {
                sender: {
                  include: { profile: true },
                },
                attachments: true,
                voiceMessage: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    return participants.map((p) => {
      const conv = p.conversation;
      const lastMsg = conv.messages[0] || null;

      // Calculate unread count
      // If user has a lastReadAt or lastReadMessageId, messages sent after that count as unread
      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        description: conv.description,
        avatarUrl: conv.avatarUrl,
        visibility: conv.visibility,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        context: conv.context,
        myRole: p.role,
        lastReadMessageId: p.lastReadMessageId,
        participants: conv.participants.map((part) => ({
          id: part.id,
          userId: part.userId,
          role: part.role,
          user: {
            id: part.user.id,
            email: part.user.email,
            profile: part.user.profile,
            presence: part.user.presence,
          },
        })),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              senderId: lastMsg.senderId,
              senderName: lastMsg.sender.profile?.displayName || 'Étudiant',
              senderAvatar: lastMsg.sender.profile?.avatarUrl,
              type: lastMsg.type,
              text: lastMsg.text,
              sentAt: lastMsg.sentAt,
              hasAttachment: lastMsg.attachments.length > 0,
              isVoiceNote: Boolean(lastMsg.voiceMessage),
            }
          : null,
      };
    });
  }

  /**
   * Find or create a direct conversation between two students (optionally contextualized by a resource)
   */
  static async getOrCreateDirectConversation(
    currentUserId: string,
    targetUserId: string,
    resourceId?: string
  ) {
    if (currentUserId === targetUserId) {
      throw new Error('Impossible de créer une conversation avec soi-même.');
    }

    // Check if target user has blocked current user or vice versa
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: currentUserId },
        ],
      },
    });

    if (block) {
      throw new Error('Communication impossible avec cet utilisateur (blocage actif).');
    }

    // Look for existing direct conversation between both users
    const existingParticipation = await prisma.conversationParticipant.findMany({
      where: {
        userId: currentUserId,
        conversation: {
          type: resourceId ? 'RESOURCE_CONTEXT' : 'DIRECT',
          ...(resourceId
            ? {
                context: {
                  resourceId,
                },
              }
            : {}),
        },
      },
      include: {
        conversation: {
          include: {
            participants: true,
            context: true,
          },
        },
      },
    });

    for (const part of existingParticipation) {
      const conv = part.conversation;
      const otherPart = conv.participants.find((p) => p.userId === targetUserId);
      if (otherPart) {
        return conv;
      }
    }

    // Fetch target user profile for title/context
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    let convType = 'DIRECT';
    let convTitle = targetUser?.profile?.displayName || 'Discussion directe';

    if (resourceId) {
      convType = 'RESOURCE_CONTEXT';
      const resource = await prisma.academicResource.findUnique({
        where: { id: resourceId },
      });
      if (resource) {
        convTitle = `Échange : ${resource.title.substring(0, 35)}...`;
      }
    }

    // Create conversation and participants atomically
    const newConv = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: convType,
          title: convTitle,
          createdById: currentUserId,
          status: 'ACTIVE',
        },
      });

      // Add current user as OWNER/MEMBER
      await tx.conversationParticipant.create({
        data: {
          conversationId: conv.id,
          userId: currentUserId,
          role: 'OWNER',
        },
      });

      // Add target user as MEMBER
      await tx.conversationParticipant.create({
        data: {
          conversationId: conv.id,
          userId: targetUserId,
          role: 'MEMBER',
        },
      });

      // Attach context if resource provided
      if (resourceId) {
        await tx.conversationContext.create({
          data: {
            conversationId: conv.id,
            contextType: 'RESOURCE',
            resourceId,
          },
        });
      }

      return conv;
    });

    return newConv;
  }

  /**
   * Create an academic or study group conversation
   */
  static async createGroupConversation(creatorId: string, dto: CreateConversationDto) {
    const participantIds = Array.from(new Set([creatorId, ...dto.participantIds]));

    const conv = await prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: {
          type: dto.type || 'GROUP',
          title: dto.title || 'Groupe d’études',
          description: dto.description || null,
          avatarUrl: dto.avatarUrl || null,
          createdById: creatorId,
          status: 'ACTIVE',
        },
      });

      // Add creator as OWNER
      await tx.conversationParticipant.create({
        data: {
          conversationId: created.id,
          userId: creatorId,
          role: 'OWNER',
          canModerate: true,
          canInviteParticipants: true,
        },
      });

      // Add other participants as MEMBER
      for (const pId of participantIds) {
        if (pId !== creatorId) {
          await tx.conversationParticipant.create({
            data: {
              conversationId: created.id,
              userId: pId,
              role: 'MEMBER',
            },
          });
        }
      }

      // If context provided
      if (dto.contextType && (dto.resourceId || dto.contextMetadata)) {
        await tx.conversationContext.create({
          data: {
            conversationId: created.id,
            contextType: dto.contextType,
            resourceId: dto.resourceId || null,
            metadata: dto.contextMetadata ? JSON.stringify(dto.contextMetadata) : null,
          },
        });
      }

      return created;
    });

    return conv;
  }

  /**
   * Get messages of a conversation with cursor pagination
   */
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    take = 30
  ) {
    // Verify membership
    const isMember = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember || isMember.leftAt) {
      throw new Error('Accès interdit : vous ne faites pas partie de cette conversation.');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { sentAt: 'desc' },
      include: {
        sender: {
          include: { profile: true },
        },
        attachments: {
          include: {
            resource: {
              include: {
                faculty: true,
                accessPolicy: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        readReceipts: true,
        voiceMessage: true,
        replyToMessage: {
          include: {
            sender: {
              include: { profile: true },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > take) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id || null;
    }

    // Format messages for front-end consumption (reverse order for chronological display)
    const formatted = messages.reverse().map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      isMe: msg.senderId === userId,
      sender: {
        id: msg.sender.id,
        displayName: msg.sender.profile?.displayName || 'Étudiant',
        avatarUrl: msg.sender.profile?.avatarUrl,
        filiere: msg.sender.profile?.filiere,
        isDelegate: msg.sender.profile?.isDelegate || false,
        isMajor: msg.sender.profile?.isMajorPromo || false,
      },
      type: msg.type,
      text: msg.text,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
      sentAt: msg.sentAt,
      editedAt: msg.editedAt,
      status: msg.status,
      replyTo: msg.replyToMessage
        ? {
            id: msg.replyToMessage.id,
            text: msg.replyToMessage.text,
            senderName: msg.replyToMessage.sender.profile?.displayName || 'Étudiant',
          }
        : null,
      attachments: msg.attachments.map((att) => ({
        id: att.id,
        type: att.attachmentType,
        url: att.url,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        thumbnailUrl: att.thumbnailUrl,
        accessSnapshot: att.accessSnapshot ? JSON.parse(att.accessSnapshot) : null,
        resource: att.resource
          ? {
              id: att.resource.id,
              title: att.resource.title,
              slug: att.resource.slug,
              thumbnailUrl: att.resource.thumbnailUrl,
              faculty: att.resource.faculty?.name,
              isPaid: att.resource.accessPolicy?.mode === 'PAID',
              priceAmount: att.resource.accessPolicy?.priceAmount || 0,
              currency: att.resource.accessPolicy?.currency || 'XOF',
            }
          : null,
      })),
      voiceMessage: msg.voiceMessage
        ? {
            id: msg.voiceMessage.id,
            audioUrl: msg.voiceMessage.audioUrl,
            durationSeconds: msg.voiceMessage.durationSeconds,
            durationMs: msg.voiceMessage.durationMs,
            waveform: msg.voiceMessage.waveformJson
              ? JSON.parse(msg.voiceMessage.waveformJson)
              : [15, 30, 60, 40, 85, 45, 20, 55, 70, 30],
          }
        : null,
      reactions: msg.reactions.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        userName: r.user.profile?.displayName || 'Étudiant',
        isMe: r.userId === userId,
      })),
      readCount: msg.readReceipts.length,
    }));

    return {
      messages: formatted,
      nextCursor,
    };
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(userId: string, dto: SendMessageDto) {
    const { conversationId, type = 'TEXT', text, replyToMessageId, resourceId, voiceNote, mediaUrl, fileName, fileSize, mimeType, metadata } = dto;

    // 1. Verify participant rights
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant || participant.leftAt) {
      throw new Error('Vous ne pouvez pas envoyer de message dans cette discussion.');
    }

    if (!participant.canSendMessages) {
      throw new Error('Vos droits d’envoi de messages sont temporairement suspendus dans cette conversation.');
    }

    // 2. Perform atomic creation
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type,
          text: text?.trim() || null,
          replyToMessageId: replyToMessageId || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          status: 'SENT',
        },
        include: {
          sender: {
            include: { profile: true },
          },
        },
      });

      // 3. Handle Resource Attachment (Phase 2 core)
      if (resourceId || type === 'RESOURCE') {
        const targetResId = resourceId;
        if (targetResId) {
          const res = await tx.academicResource.findUnique({
            where: { id: targetResId },
            include: {
              accessPolicy: true,
              author: { include: { profile: true } },
            },
          });

          if (res) {
            const isPaid = res.accessPolicy?.mode === 'PAID';
            const snapshot = {
              title: res.title,
              slug: res.slug,
              isPaid,
              priceAmount: res.accessPolicy?.priceAmount || 0,
              currency: res.accessPolicy?.currency || 'XOF',
              authorName: res.author.profile?.displayName || 'Auteur',
              badgeQuality: res.badgeQuality || 'Vérifié',
            };

            await tx.messageAttachment.create({
              data: {
                messageId: msg.id,
                attachmentType: 'RESOURCE',
                url: `/ressources/${res.slug}`,
                fileName: `${res.title}.pdf`,
                thumbnailUrl: res.thumbnailUrl,
                resourceId: res.id,
                accessSnapshot: JSON.stringify(snapshot),
              },
            });
          }
        }
      }

      // 4. Handle Media Attachment (PDF, Image, Video, Audio)
      if (mediaUrl) {
        await tx.messageAttachment.create({
          data: {
            messageId: msg.id,
            attachmentType: type === 'IMAGE' ? 'IMAGE' : type === 'VIDEO' ? 'VIDEO' : 'FILE',
            url: mediaUrl,
            fileName: fileName || 'fichier',
            fileSize: fileSize || 0,
            mimeType: mimeType || 'application/octet-stream',
          },
        });
      }

      // 5. Handle Voice Note (Phase 4 core)
      if (voiceNote || type === 'VOICE_NOTE') {
        if (voiceNote?.audioUrl) {
          await tx.voiceMessage.create({
            data: {
              messageId: msg.id,
              userId,
              audioUrl: voiceNote.audioUrl,
              durationSeconds: voiceNote.durationSeconds || Math.round(voiceNote.durationMs / 1000) || 0,
              durationMs: voiceNote.durationMs || (voiceNote.durationSeconds * 1000) || 0,
              waveformJson: voiceNote.waveform ? JSON.stringify(voiceNote.waveform) : null,
            },
          });
        }
      }

      // 6. Bump conversation updatedAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // Notify real-time stream
    realTimeBus.emitToConversation(conversationId, 'message.created', {
      messageId: message.id,
      conversationId,
      senderId: userId,
      type: message.type,
      text: message.text,
      sentAt: message.sentAt,
    });

    return message;
  }

  /**
   * Toggle emoji reaction on a message
   */
  static async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      return { action: 'REMOVED', emoji };
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
      return { action: 'ADDED', emoji };
    }
  }

  /**
   * Mark message or conversation as read
   */
  static async markAsRead(conversationId: string, userId: string, lastMessageId: string) {
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadMessageId: lastMessageId,
        lastReadAt: new Date(),
      },
    });

    // Create receipt if not already registered
    try {
      await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: lastMessageId,
            userId,
          },
        },
        update: { readAt: new Date() },
        create: {
          messageId: lastMessageId,
          userId,
        },
      });
    } catch {
      // Ignored if duplicate
    }

    return { success: true };
  }
}
