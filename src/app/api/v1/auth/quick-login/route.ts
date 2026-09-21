import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant utilisateur requis.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        profile: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
          },
        },
        wallet: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Compte introuvable ou inactif en base de données.' },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `Connexion réussie en tant que ${user.profile?.displayName || user.email} !`,
      user: {
        id: user.id,
        ine: user.ine,
        email: user.email,
        phoneNumber: user.phoneNumber,
        points: user.points,
        emailVerified: user.emailVerified,
        profile: user.profile,
        wallet: user.wallet,
        roles: user.roles.map((r) => r.role.name),
      },
    });

    response.cookies.set('campus_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('API Error /auth/quick-login:', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la connexion rapide.' },
      { status: 500 }
    );
  }
}
