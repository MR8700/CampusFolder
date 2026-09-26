import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { CallingService } from '@/lib/messaging/calling-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: callId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'START', shareType = 'FULL_SCREEN' } = body;

    if (action === 'START') {
      const session = await CallingService.startScreenShare(callId, user.id, shareType);
      return NextResponse.json({ success: true, session });
    } else {
      const result = await CallingService.stopScreenShare(callId, user.id);
      return NextResponse.json({ success: true, result });
    }
  } catch (error: any) {
    console.error('API Error POST /calls/[id]/screen-share:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
