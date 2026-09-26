import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { CallingService } from '@/lib/messaging/calling-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Active calls where user is invited or connected
    const activeParticipations = await prisma.callParticipant.findMany({
      where: {
        userId: user.id,
        call: {
          status: { in: ['RINGING', 'ACTIVE'] },
        },
      },
      include: {
        call: {
          include: {
            initiator: { include: { profile: true } },
            participants: {
              include: { user: { include: { profile: true } } },
            },
            offer: true,
          },
        },
      },
    });

    const calls = activeParticipations.map((p) => p.call);

    return NextResponse.json({
      success: true,
      activeCalls: calls,
    });
  } catch (error: any) {
    console.error('API Error GET /calls:', error);
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
    const { conversationId, recipientId, type = 'VOICE', isGroup = false, title, isMonetized, ticketPrice } = body;

    const call = await CallingService.initiateCall(user.id, {
      conversationId,
      recipientId,
      type,
      isGroup,
      title,
      isMonetized,
      ticketPrice,
    });

    return NextResponse.json({
      success: true,
      call,
    });
  } catch (error: any) {
    console.error('API Error POST /calls:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
