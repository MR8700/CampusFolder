import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const where: Record<string, any> = {};
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (institutionId && institutionId !== 'all') {
      where.institutionId = institutionId;
    }

    const faculties = await prisma.faculty.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            shortName: true,
            region: true,
            city: true,
          },
        },
        filieres: {
          where: includeArchived ? {} : { isArchived: false },
        },
        _count: {
          select: {
            resources: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const facultiesWithCounts = faculties.map((f) => ({
      ...f,
      activeDocsCount: f._count?.resources ?? f.activeDocsCount,
    }));

    return NextResponse.json({ success: true, faculties: facultiesWithCounts });
  } catch (error) {
    console.error('API Error /academic/faculties:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
