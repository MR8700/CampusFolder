import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { PresenceService } from '@/lib/messaging/presence-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userIds = searchParams.get('userIds');

    if (userIds) {
      const ids = userIds.split(',').filter(Boolean);
      const batch = await PresenceService.getBatchPresence(ids);
      return NextResponse.json({ success: true, presence: batch });
    }

    if (userId) {
      const presence = await PresenceService.getUserPresence(userId);
      return NextResponse.json({ success: true, presence });
    }

    return NextResponse.json({ error: 'userId ou userIds requis' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error GET /presence:', error);
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
    const { status, customStatus } = body;

    let presence;
    if (status && status !== 'ONLINE') {
      presence = await PresenceService.setStatus(user.id, status);
    } else {
      presence = await PresenceService.heartbeat(user.id, customStatus);
    }

    return NextResponse.json({
      success: true,
      presence,
    });
  } catch (error: any) {
    console.error('API Error POST /presence:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
