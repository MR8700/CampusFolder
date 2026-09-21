import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const institutionId = searchParams.get('institutionId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const where: Record<string, any> = {};
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (facultyId && facultyId !== 'all') {
      where.facultyId = facultyId;
    }
    if (institutionId && institutionId !== 'all') {
      where.faculty = { institutionId };
    }

    const filieres = await prisma.filiere.findMany({
      where,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
            institution: {
              select: {
                id: true,
                name: true,
                shortName: true,
                region: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ success: true, filieres });
  } catch (error: any) {
    console.error('Error GET /academic/filieres:', error);
    return NextResponse.json({ success: false, error: 'Erreur chargement des filières' }, { status: 500 });
  }
}
