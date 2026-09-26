import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { MessagingService } from '@/lib/messaging/messaging-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { emoji = '👍' } = body;

    const result = await MessagingService.toggleReaction(messageId, user.id, emoji);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('API Error POST /messages/[id]/reactions:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
