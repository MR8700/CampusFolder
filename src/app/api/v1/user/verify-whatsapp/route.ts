import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phoneNumber } = body;

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    if (user.phoneVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Votre numéro WhatsApp est déjà vérifié et certifié.',
        phoneVerified: true,
        points: user.points,
      });
    }

    const targetPhone = (phoneNumber || user.phoneNumber || '').trim();
    if (!targetPhone) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone WhatsApp requis.' },
        { status: 400 }
      );
    }

    // Award exactly +1 point Amphi for WhatsApp certification
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneNumber: targetPhone,
        phoneVerified: true,
        points: { increment: 1 },
      },
      include: {
        profile: true,
      },
    });

    // Record audit activity
    await prisma.activityLog.create({
      data: {
        userId: updatedUser.id,
        action: 'CERTIFICATION_WHATSAPP',
        title: 'Certification WhatsApp (+1 pt Amphi)',
        category: 'SECURITY',
        metadata: JSON.stringify({
          phoneNumber: targetPhone,
          pointsAwarded: 1,
          certifiedAt: new Date().toISOString(),
        }),
      },
    }).catch((err) => console.error('[ACTIVITY LOG ERROR]', err));

    return NextResponse.json({
      success: true,
      message: 'Numéro WhatsApp certifié avec succès ! (+1 point Amphi accordé)',
      phoneVerified: true,
      points: updatedUser.points,
    });
  } catch (error: any) {
    console.error('Error POST /api/v1/user/verify-whatsapp:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la certification WhatsApp.' },
      { status: 500 }
    );
  }
}
