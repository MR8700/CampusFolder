import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Veuillez renseigner votre identifiant (Email ou INE) et votre mot de passe.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // Look up by email (case-insensitive) OR by INE (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { ine: cleanIdentifier.toUpperCase() },
        ],
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
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // 1. Check if account is temporarily locked (anti-bruteforce)
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      return NextResponse.json(
        {
          error: `Compte temporairement verrouillé suite à plusieurs tentatives infructueuses. Veuillez réessayer dans ${remainingMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    // 2. Verify Password
    const isMatch = verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockUpdate: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newAttempts,
      };

      if (newAttempts >= 5) {
        lockUpdate.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock 15 mins
      }

      await prisma.user.update({
        where: { id: user.id },
        data: lockUpdate,
      });

      const remainingAttempts = Math.max(0, 5 - newAttempts);
      const warningMsg =
        remainingAttempts > 0
          ? `Mot de passe incorrect. Attention : plus que ${remainingAttempts} tentative(s) avant verrouillage de sécurité.`
          : 'Compte verrouillé pour 15 minutes suite à 5 échecs consécutifs.';

      return NextResponse.json({ error: warningMsg }, { status: 401 });
    }

    // 3. Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie !',
      user: {
        id: user.id,
        ine: user.ine,
        email: user.email,
        phoneNumber: user.phoneNumber,
        points: user.points,
        emailVerified: user.emailVerified,
        profile: user.profile,
        wallet: user.wallet,
        role:
          Boolean(user.isSuperAdmin) ||
          user.email?.toLowerCase() === 'admin@campusfolder.bf' ||
          user.roles.some(
            (r: any) =>
              r.role.code === 'ADMIN' ||
              r.role.name === 'ADMIN' ||
              r.role.name === 'Administrateur'
          )
            ? 'ADMIN'
            : 'STUDENT',
        roles: user.roles.map((r: any) => r.role.code || r.role.name),
        isSuperAdmin: Boolean(user.isSuperAdmin) || user.email?.toLowerCase() === 'admin@campusfolder.bf',
      },
    });

    // Set HTTP-only secure session cookie
    response.cookies.set('campus_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('API Error /auth/login:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la tentative de connexion.' },
      { status: 500 }
    );
  }
}
