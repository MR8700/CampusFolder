import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { realTimeBus } from '@/lib/messaging/event-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { include: { profile: true } },
        attachments: true,
        reactions: true,
        voiceMessage: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('API Error GET /messages/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    }

    if (message.senderId !== user.id) {
      return NextResponse.json({ error: 'Seul l’auteur peut modifier ce message' }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: text?.trim() || message.text,
        editedAt: new Date(),
      },
    });

    realTimeBus.emitToConversation(message.conversationId, 'message.updated', {
      messageId: updated.id,
      text: updated.text,
      editedAt: updated.editedAt,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error('API Error PATCH /messages/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: { where: { userId: user.id } },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    }

    const myRole = message.conversation.participants[0]?.role;
    const isAuthor = message.senderId === user.id;
    const isModerator = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MODERATOR';

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: 'Permissions insuffisantes pour supprimer ce message' }, { status: 403 });
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        text: 'Ce message a été supprimé.',
      },
    });

    realTimeBus.emitToConversation(message.conversationId, 'message.deleted', {
      messageId,
    });

    return NextResponse.json({ success: true, message: 'Message supprimé' });
  } catch (error: any) {
    console.error('API Error DELETE /messages/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
