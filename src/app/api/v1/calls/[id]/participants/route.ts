import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/messaging/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: callId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const participants = await prisma.callParticipant.findMany({
      where: { callId },
      include: {
        user: {
          include: {
            profile: true,
            presence: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      callId,
      participants: participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        status: p.status,
        isMuted: p.isMuted,
        isVideoOn: p.isVideoOn,
        isScreenSharing: p.isScreenSharing,
        joinedAt: p.joinedAt,
        displayName: p.user.profile?.displayName || 'Étudiant',
        avatarUrl: p.user.profile?.avatarUrl,
        filiere: p.user.profile?.filiere,
      })),
    });
  } catch (error: any) {
    console.error('API Error GET /calls/[id]/participants:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
