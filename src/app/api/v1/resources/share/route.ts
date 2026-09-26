import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { ResourceSharingService } from '@/lib/messaging/resource-sharing-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, resourceId, messageText } = body;

    if (!conversationId || !resourceId) {
      return NextResponse.json(
        { error: 'conversationId et resourceId sont obligatoires' },
        { status: 400 }
      );
    }

    const result = await ResourceSharingService.shareResourceToConversation(
      user.id,
      conversationId,
      resourceId,
      messageText
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('API Error POST /resources/share:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
