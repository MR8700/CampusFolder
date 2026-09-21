import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
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

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        ine: user.ine,
        email: user.email,
        phoneNumber: user.phoneNumber,
        points: user.points,
        status: user.status,
        emailVerified: user.emailVerified,
        profile: user.profile,
        wallet: user.wallet,
        role:
          Boolean(user.isSuperAdmin) ||
          user.email === 'admin@campusfolder.bf' ||
          user.roles.some(
            (r) =>
              r.role.code === 'ADMIN' ||
              r.role.name === 'ADMIN' ||
              r.role.name === 'Administrateur'
          )
            ? 'ADMIN'
            : 'STUDENT',
        roles: user.roles.map((r) => r.role.code || r.role.name),
        isSuperAdmin: Boolean(user.isSuperAdmin) || user.email === 'admin@campusfolder.bf',
      },
    });
  } catch (error) {
    console.error('API Error /auth/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
