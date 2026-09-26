import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { ModerationService } from '@/lib/messaging/moderation-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, action = 'BLOCK', reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId requis' }, { status: 400 });
    }

    if (action === 'BLOCK') {
      const block = await ModerationService.blockUser(user.id, targetUserId, reason);
      return NextResponse.json({ success: true, block });
    } else {
      const result = await ModerationService.unblockUser(user.id, targetUserId);
      return NextResponse.json({ success: true, result });
    }
  } catch (error: any) {
    console.error('API Error POST /moderation/block:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
