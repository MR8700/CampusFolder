import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/messaging/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        context: {
          include: {
            resource: {
              include: {
                faculty: true,
                accessPolicy: true,
                author: { include: { profile: true } },
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
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    // Verify user is active participant
    const myParticipant = conversation.participants.find((p) => p.userId === user.id && !p.leftAt);
    if (!myParticipant) {
      return NextResponse.json({ error: 'Accès non autorisé à cette discussion' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        displayName: user.profile?.displayName || 'Moi',
      },
      conversation: {
        ...conversation,
        myRole: myParticipant.role,
        myParticipantId: myParticipant.id,
      },
    });
  } catch (error: any) {
    console.error('API Error GET /conversations/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, isMuted } = body;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });

    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    if (title || description) {
      if (participant.role !== 'OWNER' && participant.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Droits administrateur requis pour modifier le titre' }, { status: 403 });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          ...(title ? { title: title.trim() } : {}),
          ...(description ? { description: description.trim() } : {}),
        },
      });
    }

    if (isMuted !== undefined) {
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: {
          mutedUntil: isMuted ? new Date(Date.now() + 365 * 24 * 3600 * 1000) : null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error PATCH /conversations/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Leave conversation
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Discussion quittée' });
  } catch (error: any) {
    console.error('API Error DELETE /conversations/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
