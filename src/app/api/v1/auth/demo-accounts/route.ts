import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        ine: true,
        points: true,
        roles: {
          include: {
            role: true,
          },
        },
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            filiere: true,
            city: true,
            institution: {
              select: {
                id: true,
                name: true,
                shortName: true,
                city: true,
              },
            },
            faculty: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            academicLevel: {
              select: {
                id: true,
                code: true,
                label: true,
              },
            },
          },
        },
      },
      take: 12,
    });

    return NextResponse.json({
      success: true,
      accounts: users,
    });
  } catch (error: any) {
    console.error('Error loading demo accounts from DB:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de charger les comptes étudiants de la base.' },
      { status: 500 }
    );
  }
}
