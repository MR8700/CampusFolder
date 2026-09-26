import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { CallingService } from '@/lib/messaging/calling-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: callId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        initiator: { include: { profile: true } },
        participants: {
          include: { user: { include: { profile: true } } },
        },
        screenShares: {
          where: { endedAt: null },
          include: { user: { include: { profile: true } } },
        },
        offer: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Session d’appel introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      call,
      currentUserId: user.id,
    });
  } catch (error: any) {
    console.error('API Error GET /calls/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: callId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // ACCEPT, LEAVE, END

    if (action === 'ACCEPT') {
      const call = await CallingService.acceptCall(callId, user.id);
      return NextResponse.json({ success: true, call });
    } else if (action === 'LEAVE' || action === 'END') {
      const result = await CallingService.leaveCall(callId, user.id);
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Error POST /calls/[id]:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
