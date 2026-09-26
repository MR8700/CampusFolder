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
    const { messageId, reason = 'INAPPROPRIATE', description } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId requis' }, { status: 400 });
    }

    const report = await ModerationService.reportMessage(user.id, messageId, reason, description);

    return NextResponse.json({
      success: true,
      message: 'Signalement transmis à l’équipe de modération académique',
      report,
    });
  } catch (error: any) {
    console.error('API Error POST /moderation/report:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
