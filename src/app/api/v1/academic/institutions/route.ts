import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region');
    const category = searchParams.get('category');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const where: Record<string, any> = {};
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (region && region !== 'all') {
      where.region = region;
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const institutions = await prisma.institution.findMany({
      where,
      include: {
        country: true,
        faculties: {
          where: includeArchived ? {} : { isArchived: false },
          include: {
            filieres: {
              where: includeArchived ? {} : { isArchived: false },
            },
          },
        },
      },
      orderBy: [
        { isLive: 'desc' },
        { activeStudentsCount: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, institutions });
  } catch (error) {
    console.error('API Error /academic/institutions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
