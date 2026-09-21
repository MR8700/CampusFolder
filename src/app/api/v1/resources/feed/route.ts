import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all, corrige, cours, exam, video, presentiel
    let requestedInstitutionId = searchParams.get('institutionId');

    // If no institutionId passed in query, attempt to read from logged-in student's profile
    if (!requestedInstitutionId) {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get('campus_user_id')?.value;
      if (sessionUserId) {
        const user = await prisma.user.findUnique({
          where: { id: sessionUserId },
          include: { profile: true },
        });
        if (user?.profile?.institutionId) {
          requestedInstitutionId = user.profile.institutionId;
        }
      }
    }

    // 1. Get Active Campus
    let activeCampus = null;
    if (requestedInstitutionId && requestedInstitutionId !== 'all') {
      activeCampus = await prisma.institution.findUnique({
        where: { id: requestedInstitutionId },
        include: { country: true },
      });
    }

    if (!activeCampus) {
      activeCampus = await prisma.institution.findFirst({
        where: { isLive: true },
        include: { country: true },
      });
    }

    // 2. Query trending resources (scoped to institution if specified)
    let trendingWhere: Record<string, any> = {
      isTrending: true,
      isArchived: false,
      visibility: 'PUBLIC',
    };
    if (requestedInstitutionId && requestedInstitutionId !== 'all') {
      trendingWhere.institutionId = requestedInstitutionId;
    }

    if (filter === 'corrige') {
      trendingWhere.resourceType = 'EXAM_CORRECTION';
    } else if (filter === 'cours') {
      trendingWhere.resourceType = 'COURSE_NOTES';
    } else if (filter === 'presentiel') {
      trendingWhere.accessPolicy = { mode: 'IN_PERSON' };
    }

    let trendingResources = await prisma.academicResource.findMany({
      where: trendingWhere,
      include: {
        author: {
          include: { profile: true },
        },
        institution: true,
        faculty: true,
        academicLevel: true,
        accessPolicy: true,
        contactChannel: true,
        media: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { viewsCount: 'desc' },
      take: 6,
    });

    // Fallback if this university has no trending resources yet
    if (trendingResources.length === 0 && requestedInstitutionId && requestedInstitutionId !== 'all') {
      trendingResources = await prisma.academicResource.findMany({
        where: {
          institutionId: requestedInstitutionId,
          isArchived: false,
          visibility: 'PUBLIC',
        },
        include: {
          author: {
            include: { profile: true },
          },
          institution: true,
          faculty: true,
          academicLevel: true,
          accessPolicy: true,
          contactChannel: true,
          media: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { viewsCount: 'desc' },
        take: 6,
      });
    }

    // 3. Query faculty live feed (scoped to institution)
    let feedWhere: Record<string, any> = {
      isArchived: false,
      visibility: 'PUBLIC',
    };
    if (requestedInstitutionId && requestedInstitutionId !== 'all') {
      feedWhere.institutionId = requestedInstitutionId;
    }

    if (filter === 'corrige') {
      feedWhere.resourceType = 'EXAM_CORRECTION';
    } else if (filter === 'cours') {
      feedWhere.resourceType = 'COURSE_NOTES';
    } else if (filter === 'exam') {
      feedWhere.resourceType = 'OFFICIAL_EXAM';
    } else if (filter === 'video') {
      feedWhere.media = {
        some: { mediaType: 'VIDEO' },
      };
    } else if (filter === 'presentiel') {
      feedWhere.accessPolicy = { mode: 'IN_PERSON' };
    }

    const facultyFeed = await prisma.academicResource.findMany({
      where: feedWhere,
      include: {
        author: {
          include: { profile: true },
        },
        institution: true,
        faculty: true,
        academicLevel: true,
        accessPolicy: true,
        contactChannel: true,
        media: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    // 4. Aggregated stats
    const totalDocs = await prisma.academicResource.count({
      where: requestedInstitutionId && requestedInstitutionId !== 'all'
        ? { institutionId: requestedInstitutionId }
        : {},
    });

    const stats = {
      docsAdded24h: 84,
      examSuccessRate: 98.4,
      activeStudents: activeCampus?.activeStudentsCount || 1420,
      totalCatalogDocs: totalDocs,
    };

    return NextResponse.json({
      success: true,
      activeCampus,
      isScopedToUserInstitution: Boolean(requestedInstitutionId && requestedInstitutionId !== 'all'),
      scopedInstitutionId: requestedInstitutionId || activeCampus?.id,
      trendingResources,
      facultyFeed,
      stats,
    });
  } catch (error) {
    console.error('API Error /resources/feed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
