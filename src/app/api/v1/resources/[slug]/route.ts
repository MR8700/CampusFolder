import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let resource = await prisma.academicResource.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
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
        reviews: {
          include: {
            user: {
              include: { profile: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!resource && slug.includes('linguistique')) {
      resource = await prisma.academicResource.findFirst({
        where: { slug: { contains: 'linguistique' } },
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
          reviews: {
            include: {
              user: {
                include: { profile: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    // Check student status for student-restricted content
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

    const isRestrictedForUser = resource.visibility === 'BURKINA_STUDENTS_ONLY' && !isBurkinaStudent;

    return NextResponse.json({
      success: true,
      resource,
      isBurkinaStudent,
      isRestrictedForUser,
      restrictionReason: isRestrictedForUser
        ? 'Ce document académique est réservé aux étudiants burkinabés inscrits avec leur numéro INE.'
        : null,
    });
  } catch (error) {
    console.error('API Error /resources/[slug]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
    }

    const resource = await prisma.academicResource.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        accessPolicy: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    const isAuthor = resource.authorId === sessionUserId;
    const isAdmin = Boolean(
      user.isSuperAdmin ||
      user.email?.toLowerCase() === 'admin@campusfolder.bf' ||
      user.roles?.some((r: any) => r.role?.code === 'ADMIN' || r.role?.name === 'ADMIN')
    );

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Action non autorisée sur ce document.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      moduleName,
      academicYear,
      visibility,
      isArchived,
      price,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (moduleName !== undefined) updateData.moduleName = String(moduleName).trim();
    if (academicYear !== undefined) updateData.academicYear = String(academicYear).trim();

    if (visibility !== undefined) {
      if (['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility)) {
        updateData.visibility = visibility;
      }
    }

    if (isArchived !== undefined) {
      updateData.isArchived = Boolean(isArchived);
    }

    // Check if content changed (title, description, moduleName, or price)
    const isContentChanged =
      (title !== undefined && title.trim() !== resource.title) ||
      (description !== undefined && description.trim() !== (resource.description || '')) ||
      (moduleName !== undefined && moduleName.trim() !== (resource.moduleName || '')) ||
      (price !== undefined && resource.accessPolicy && Number(price) !== resource.accessPolicy.priceAmount);

    let resubmitted = false;

    // RULE: If resource was APPROVED, any author content edit resets it to PENDING for admin review
    if (isAuthor && resource.validationStatus === 'APPROVED' && isContentChanged) {
      updateData.validationStatus = 'PENDING';
      updateData.validatedAt = null;
      updateData.validatedBy = null;
      updateData.validationNote = "Publication modifiée par l'auteur. Réexamen requis (SLA 24h)";
      updateData.submittedAt = new Date();
      updateData.reminderCount = 0;
      updateData.priorityScore = (resource.priorityScore || 0) + 5;
      resubmitted = true;

      await prisma.activityLog.create({
        data: {
          userId: sessionUserId,
          action: 'RESOURCE_MODIFIED_RESUBMITTED',
          title: `Ressource modifiée : ${title || resource.title}`,
          category: 'ACADEMIC',
          metadata: JSON.stringify({ note: 'Réexamen requis (SLA 24h)' }),
        },
      });
    }

    // Update Access Policy price if provided
    if (price !== undefined && resource.accessPolicy?.id) {
      const priceVal = Math.max(0, Math.min(1000, Number(price) || 0));
      await prisma.accessPolicy.update({
        where: { id: resource.accessPolicy.id },
        data: {
          priceAmount: priceVal,
          mode: priceVal > 0 ? 'PAID' : 'FREE',
        },
      });
    }

    const updatedResource = await prisma.academicResource.update({
      where: { id: resource.id },
      data: updateData,
      include: {
        accessPolicy: true,
        institution: true,
        faculty: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: resubmitted
        ? 'Document modifié avec succès. Étant préalablement validé, il a été replacé en attente d\'examen modérateur (délai 24h).'
        : 'Document mis à jour avec succès.',
      resubmitted,
      resource: updatedResource,
    });
  } catch (error) {
    console.error('API Error /resources/[slug] (PATCH):', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la ressource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
    }

    const resource = await prisma.academicResource.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    const isAuthor = resource.authorId === sessionUserId;
    const isAdmin = Boolean(
      user.isSuperAdmin ||
      user.email?.toLowerCase() === 'admin@campusfolder.bf' ||
      user.roles?.some((r: any) => r.role?.code === 'ADMIN' || r.role?.name === 'ADMIN')
    );

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Vous ne disposez pas des droits pour supprimer ce document.' },
        { status: 403 }
      );
    }

    // Log author activity
    await prisma.activityLog.create({
      data: {
        userId: sessionUserId,
        action: 'RESOURCE_DELETED_BY_AUTHOR',
        title: `Ressource supprimée : ${resource.title}`,
        category: 'ACADEMIC',
      },
    });

    // Cascade delete handles orders, entitlements, media, reviews
    await prisma.academicResource.delete({
      where: { id: resource.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Publication supprimée avec succès.',
    });
  } catch (error) {
    console.error('API Error /resources/[slug] (DELETE):', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la publication' },
      { status: 500 }
    );
  }
}

