import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { MessagingService } from '@/lib/messaging/messaging-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const conversations = await MessagingService.getUserConversations(user.id);

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        displayName: user.profile?.displayName || 'Moi',
        avatarUrl: user.profile?.avatarUrl,
      },
      conversations,
    });
  } catch (error: any) {
    console.error('API Error GET /conversations:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { type = 'DIRECT', targetUserId, participantIds, title, description, resourceId } = body;

    let conversation;
    if (type === 'DIRECT') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId requis pour un échange direct' }, { status: 400 });
      }
      conversation = await MessagingService.getOrCreateDirectConversation(user.id, targetUserId, resourceId);
    } else {
      if (!title || !participantIds || !Array.isArray(participantIds)) {
        return NextResponse.json({ error: 'Titre et liste de participants requis pour un groupe' }, { status: 400 });
      }
      conversation = await MessagingService.createGroupConversation(user.id, {
        type,
        title,
        description,
        participantIds,
        resourceId,
        contextType: resourceId ? 'RESOURCE' : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('API Error POST /conversations:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
