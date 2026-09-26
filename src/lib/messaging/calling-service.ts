import { prisma } from '@/lib/prisma';
import { CallInitiateDto } from './types';
import { realTimeBus } from './event-bus';
import { PresenceService } from './presence-service';

export class CallingService {
  /**
   * Initiate a voice or video call (Direct, Group, or Monetized Masterclass)
   */
  static async initiateCall(initiatorId: string, dto: CallInitiateDto) {
    const { conversationId, recipientId, type, isGroup = false, title, isMonetized = false, ticketPrice = 0 } = dto;

    const channelName = `call-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const call = await prisma.$transaction(async (tx) => {
      const createdCall = await tx.call.create({
        data: {
          conversationId: conversationId || null,
          initiatorId,
          type,
          title: title || (type === 'VIDEO' ? 'Appel Vidéo' : 'Appel Vocal'),
          status: 'RINGING',
          channelName,
          isGroup,
          maxParticipants: isGroup ? 100 : 2,
        },
      });

      // 1. Add initiator as HOST
      await tx.callParticipant.create({
        data: {
          callId: createdCall.id,
          userId: initiatorId,
          role: 'HOST',
          status: 'CONNECTED',
          joinedAt: new Date(),
        },
      });

      // 2. Add recipient if direct call
      if (recipientId && !isGroup) {
        await tx.callParticipant.create({
          data: {
            callId: createdCall.id,
            userId: recipientId,
            role: 'PARTICIPANT',
            status: 'RINGING',
          },
        });
      }

      // 3. Create monetization offer if requested (Phase 10)
      if (isMonetized && ticketPrice > 0) {
        await tx.callOffer.create({
          data: {
            callId: createdCall.id,
            pricingModel: 'ONE_TIME',
            ticketPrice,
            currency: 'XOF',
            description: `Accès conférence : ${title || 'Session de travail'}`,
          },
        });
      }

      // 4. Create CallSession tracking
      await tx.callSession.create({
        data: {
          callId: createdCall.id,
          sessionId: `sess-${channelName}`,
          serverRegion: 'west-africa-ci',
        },
      });

      return createdCall;
    });

    // Update presence
    await PresenceService.setStatus(initiatorId, 'IN_CALL', call.id);

    // Broadcast call ringing event
    if (recipientId) {
      realTimeBus.emitToUser(recipientId, 'call.ringing', {
        callId: call.id,
        channelName: call.channelName,
        type: call.type,
        initiatorId,
        title: call.title,
      });
    }

    if (conversationId) {
      realTimeBus.emitToConversation(conversationId, 'call.created', {
        callId: call.id,
        channelName: call.channelName,
        type: call.type,
        initiatorId,
      });
    }

    return call;
  }

  /**
   * Accept an incoming call
   */
  static async acceptCall(callId: string, userId: string) {
    const participant = await prisma.callParticipant.findUnique({
      where: { callId_userId: { callId, userId } },
    });

    if (!participant) {
      // Add participant if group
      await prisma.callParticipant.create({
        data: {
          callId,
          userId,
          role: 'PARTICIPANT',
          status: 'CONNECTED',
          joinedAt: new Date(),
        },
      });
    } else {
      await prisma.callParticipant.update({
        where: { id: participant.id },
        data: {
          status: 'CONNECTED',
          joinedAt: new Date(),
        },
      });
    }

    // Update call to ACTIVE
    const call = await prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    await PresenceService.setStatus(userId, 'IN_CALL', callId);

    // Broadcast accepted event
    realTimeBus.emitToCallRoom(call.channelName, 'call.accepted', {
      callId,
      userId,
    });

    return call;
  }

  /**
   * Leave or decline a call
   */
  static async leaveCall(callId: string, userId: string) {
    await prisma.callParticipant.updateMany({
      where: { callId, userId },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    await PresenceService.setStatus(userId, 'ONLINE', undefined);

    // Check if any connected participants remain
    const remaining = await prisma.callParticipant.count({
      where: { callId, status: 'CONNECTED' },
    });

    if (remaining === 0) {
      const call = await prisma.call.findUnique({ where: { id: callId } });
      const started = call?.startedAt || call?.createdAt || new Date();
      const durationSeconds = Math.round((Date.now() - new Date(started).getTime()) / 1000);

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          durationSeconds: Math.max(0, durationSeconds),
        },
      });

      realTimeBus.emitToCallRoom(call?.channelName || '', 'call.ended', {
        callId,
        durationSeconds,
      });
    } else {
      realTimeBus.emitToCallRoom(callId, 'call.participant.left', {
        callId,
        userId,
      });
    }

    return { success: true };
  }

  /**
   * Start screen sharing session
   */
  static async startScreenShare(callId: string, userId: string, shareType = 'FULL_SCREEN') {
    const session = await prisma.screenShareSession.create({
      data: {
        callId,
        userId,
        shareType,
      },
    });

    await prisma.call.update({
      where: { id: callId },
      data: { isScreenShared: true },
    });

    await prisma.callParticipant.updateMany({
      where: { callId, userId },
      data: { isScreenSharing: true },
    });

    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (call) {
      realTimeBus.emitToCallRoom(call.channelName, 'screen-share.started', {
        callId,
        userId,
        sessionId: session.id,
      });
    }

    return session;
  }

  /**
   * Stop screen sharing session
   */
  static async stopScreenShare(callId: string, userId: string) {
    await prisma.screenShareSession.updateMany({
      where: { callId, userId, endedAt: null },
      data: { endedAt: new Date() },
    });

    await prisma.callParticipant.updateMany({
      where: { callId, userId },
      data: { isScreenSharing: false },
    });

    // Check if any other user is still sharing
    const activeShares = await prisma.screenShareSession.count({
      where: { callId, endedAt: null },
    });

    if (activeShares === 0) {
      await prisma.call.update({
        where: { id: callId },
        data: { isScreenShared: false },
      });
    }

    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (call) {
      realTimeBus.emitToCallRoom(call.channelName, 'screen-share.stopped', {
        callId,
        userId,
      });
    }

    return { success: true };
  }

  /**
   * Purchase access to a monetized masterclass/call
   */
  static async purchaseCallTicket(userId: string, callOfferId: string) {
    const offer = await prisma.callOffer.findUnique({
      where: { id: callOfferId },
      include: {
        call: {
          include: { initiator: { include: { wallet: true } } },
        },
      },
    });

    if (!offer) throw new Error('Offre de conférence introuvable.');

    const price = offer.ticketPrice;
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!buyer || !buyer.wallet || buyer.wallet.availableBalance < price) {
      throw new Error('Solde portefeuille insuffisant pour acquérir ce billet.');
    }

    const accessCode = `TCK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Execute ledger deduction and distribution atomically
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Debit buyer wallet
      await tx.wallet.update({
        where: { id: buyer.wallet!.id },
        data: {
          availableBalance: { decrement: price },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: buyer.wallet!.id,
          entryType: 'ORDER_PURCHASE',
          direction: 'DEBIT',
          amount: price,
          balanceAfter: buyer.wallet!.availableBalance - price,
          referenceId: offer.callId,
          description: `Billet Masterclass : ${offer.call.title || 'Session de travail'}`,
        },
      });

      // 2. Credit host wallet (85% creator, 15% platform)
      const platformFee = Math.round(price * 0.15);
      const hostRevenue = price - platformFee;

      const hostWallet = offer.call.initiator.wallet;
      if (hostWallet) {
        await tx.wallet.update({
          where: { id: hostWallet.id },
          data: {
            availableBalance: { increment: hostRevenue },
          },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: hostWallet.id,
            entryType: 'SALE_REVENUE',
            direction: 'CREDIT',
            amount: hostRevenue,
            balanceAfter: hostWallet.availableBalance + hostRevenue,
            referenceId: offer.callId,
            description: `Rémunération Masterclass [85%] : ${offer.call.title || 'Session'}`,
          },
        });
      }

      // 3. Create purchase ticket
      const createdPurchase = await tx.callPurchase.create({
        data: {
          callOfferId,
          userId,
          amountPaid: price,
          currency: offer.currency,
          accessCode,
          isAdmitted: true,
        },
      });

      // 4. Increment sold tickets
      await tx.callOffer.update({
        where: { id: callOfferId },
        data: { soldTickets: { increment: 1 } },
      });

      return createdPurchase;
    });

    return purchase;
  }
}
