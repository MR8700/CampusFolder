import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // 1. Unlocked / Purchased Documents
    const entitlements = await prisma.entitlement.findMany({
      where: {
        userId: sessionUserId,
        isRevoked: false,
      },
      include: {
        resource: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
            media: true,
            author: {
              include: { profile: true },
            },
            accessPolicy: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Published Documents by User
    const publishedResources = await prisma.academicResource.findMany({
      where: {
        authorId: sessionUserId,
      },
      include: {
        institution: true,
        faculty: true,
        academicLevel: true,
        media: true,
        accessPolicy: true,
        _count: {
          select: {
            orders: { where: { status: 'PAID' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      purchasedDocuments: entitlements.map((e) => ({
        id: e.id,
        downloadToken: e.downloadToken,
        tokenExpiresAt: e.tokenExpiresAt,
        downloadCount: e.downloadCount,
        unlockedAt: e.createdAt,
        resource: {
          id: e.resource.id,
          title: e.resource.title,
          slug: e.resource.slug,
          documentType: e.resource.resourceType,
          mediaFormat: e.resource.media[0]?.mediaType || 'PDF',
          institution: e.resource.institution?.shortName || e.resource.institution?.name,
          faculty: e.resource.faculty?.name,
          academicLevel: e.resource.academicLevel?.label || e.resource.academicLevel?.code,
          price: e.resource.accessPolicy?.priceAmount || 0,
          media: e.resource.media.map((m) => ({
            id: m.id,
            filename: m.originalFilename,
            type: m.mediaType,
            sizeBytes: m.sizeBytes,
            url: m.storagePath,
          })),
          authorName:
            e.resource.author.profile?.displayName ||
            `${e.resource.author.profile?.firstName || ''} ${e.resource.author.profile?.lastName || ''}`.trim() ||
            e.resource.author.email,
        },
      })),
      publishedDocuments: publishedResources.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description,
        moduleName: r.moduleName,
        academicYear: r.academicYear,
        visibility: r.visibility || 'PUBLIC',
        isArchived: Boolean(r.isArchived),
        documentType: r.resourceType,
        mediaFormat: r.media[0]?.mediaType || 'PDF',
        validationStatus: r.validationStatus,
        validationNote: r.validationNote,
        submittedAt: r.submittedAt,
        validatedAt: r.validatedAt,
        reminderCount: r.reminderCount,
        viewsCount: r.viewsCount,
        downloadsCount: r.downloadsCount,
        salesCount: r._count.orders,
        price: r.accessPolicy?.priceAmount || 0,
        royaltiesEarned: (r._count.orders || 0) * Math.round((r.accessPolicy?.priceAmount || 0) * 0.85),
        institution: r.institution?.shortName || r.institution?.name,
        faculty: r.faculty?.name,
        media: r.media.map((m) => ({
          id: m.id,
          filename: m.originalFilename,
          type: m.mediaType,
          sizeBytes: m.sizeBytes,
          url: m.storagePath,
        })),
      })),
    });
  } catch (error: any) {
    console.error('Error GET /api/v1/user/mediatheque:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement de la médiathèque.' },
      { status: 500 }
    );
  }
}
