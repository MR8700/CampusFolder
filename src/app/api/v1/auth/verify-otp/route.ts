import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email et code de vérification requis.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: {
        profile: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
          },
        },
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Votre compte est déjà vérifié. Vous pouvez vous connecter.',
        user,
      });
    }

    // Check OTP expiration
    if (user.verificationOtpExpiresAt && new Date() > user.verificationOtpExpiresAt) {
      return NextResponse.json(
        { error: 'Le code de vérification a expiré. Veuillez en redemander un nouveau.' },
        { status: 400 }
      );
    }

    // Check OTP value
    if (user.verificationOtp !== otp.trim()) {
      return NextResponse.json(
        { error: 'Code de vérification incorrect. Veuillez vérifier vos emails.' },
        { status: 400 }
      );
    }

    // Mark as verified & active (+1 pt Amphi for Gmail/Email certification)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        verificationOtp: null,
        verificationOtpExpiresAt: null,
        points: { increment: 1 },
      },
      include: {
        profile: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
          },
        },
        wallet: true,
      },
    });

    // Audit log activity
    await prisma.activityLog.create({
      data: {
        userId: updatedUser.id,
        action: 'CERTIFICATION_GMAIL',
        title: 'Certification Gmail / Email (+1 pt Amphi)',
        category: 'SECURITY',
        metadata: JSON.stringify({
          email: updatedUser.email,
          pointsAwarded: 1,
          certifiedAt: new Date().toISOString(),
        }),
      },
    }).catch((err) => console.error('[ACTIVITY LOG ERROR]', err));

    // Create response with auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès ! (+1 point Amphi accordé)',
      user: updatedUser,
    });

    response.cookies.set('campus_user_id', updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('API Error /auth/verify-otp:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation du code.' },
      { status: 500 }
    );
  }
}
