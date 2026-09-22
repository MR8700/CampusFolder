import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const facultyCode = searchParams.get('faculty');
    const levelCode = searchParams.get('level');
    const institutionId = searchParams.get('institutionId');
    const region = searchParams.get('region');
    const filiereId = searchParams.get('filiereId');
    const accessMode = searchParams.get('accessMode');
    const sort = searchParams.get('sort') || 'recent'; // recent, rated, exam, free

    // Check student session for visibility filtering
    let isBurkinaStudent = false;
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { roles: { include: { role: true } } },
      });
      if (user) {
        const hasStudentRole = user.roles.some(
          (r) => r.role.code === 'STUDENT' || r.role.code === 'DELEGATE' || r.role.code === 'ADMIN'
        );
        isBurkinaStudent = Boolean(user.ine || user.isSuperAdmin || hasStudentRole);
      }
    }

    const allowedVisibilities = isBurkinaStudent
      ? ['PUBLIC', 'BURKINA_STUDENTS_ONLY']
      : ['PUBLIC'];

    const andConditions: any[] = [
      { validationStatus: 'APPROVED' },
      { isArchived: false },
      { visibility: { in: allowedVisibilities } },
    ];

    if (q.trim()) {
      const term = q.trim();
      andConditions.push({
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
          { moduleName: { contains: term } },
          { author: { profile: { displayName: { contains: term } } } },
          { author: { profile: { firstName: { contains: term } } } },
          { author: { profile: { lastName: { contains: term } } } },
          { faculty: { name: { contains: term } } },
          { filiere: { name: { contains: term } } },
        ],
      });
    }

    if (facultyCode && facultyCode !== 'all') {
      const f = facultyCode.trim();
      andConditions.push({
        OR: [
          { facultyId: f },
          { faculty: { code: { in: [f, f.toLowerCase(), f.toUpperCase()] } } },
          { faculty: { name: { contains: f } } },
        ],
      });
    }

    if (levelCode && levelCode !== 'all') {
      const lvl = levelCode.trim();
      andConditions.push({
        OR: [
          { academicLevelId: lvl },
          { academicLevel: { code: { in: [lvl, lvl.toLowerCase(), lvl.toUpperCase()] } } },
        ],
      });
    }

    if (institutionId && institutionId !== 'all') {
      const inst = institutionId.trim();
      andConditions.push({
        OR: [
          { institutionId: inst },
          { institution: { shortName: { contains: inst } } },
          { institution: { name: { contains: inst } } },
        ],
      });
    }

    if (region && region !== 'all') {
      const r = region.trim();
      andConditions.push({
        institution: {
          region: { in: [r, r.toLowerCase(), r.toUpperCase()] },
        },
      });
    }

    if (filiereId && filiereId !== 'all') {
      const fil = filiereId.trim();
      andConditions.push({
        OR: [
          { filiereId: fil },
          { filiere: { code: { in: [fil, fil.toLowerCase(), fil.toUpperCase()] } } },
          { filiere: { name: { contains: fil } } },
        ],
      });
    }

    if (accessMode && accessMode !== 'all') {
      andConditions.push({
        accessPolicy: { mode: accessMode },
      });
    }

    let orderBy: Record<string, any> = { createdAt: 'desc' };
    if (sort === 'rated' || sort === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    } else if (sort === 'downloads') {
      orderBy = { downloadsCount: 'desc' };
    } else if (sort === 'free') {
      andConditions.push({ accessPolicy: { mode: 'FREE' } });
    } else if (sort === 'exam') {
      andConditions.push({ resourceType: { in: ['OFFICIAL_EXAM', 'EXAM_CORRECTION'] } });
    }

    const where = { AND: andConditions };

    // Also get Spotlight resource (Droit Administratif L2)
    const spotlightResource = await prisma.academicResource.findFirst({
      where: { slug: 'droit-administratif-l2-fiche-certifiee-major-ujkz' },
      include: {
        author: { include: { profile: true } },
        faculty: true,
        academicLevel: true,
        accessPolicy: true,
      },
    });

    const results = await prisma.academicResource.findMany({
      where,
      include: {
        author: { include: { profile: true } },
        faculty: true,
        academicLevel: true,
        accessPolicy: true,
        contactChannel: true,
        institution: {
          select: {
            id: true,
            name: true,
            shortName: true,
            region: true,
            city: true,
          },
        },
        media: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy,
      take: 50,
    });

    return NextResponse.json({
      success: true,
      spotlightResource,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('API Error /resources/search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
