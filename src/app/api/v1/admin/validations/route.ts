import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendResourceApprovedEmail, sendResourceRejectedEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (status !== 'ALL') {
      where.validationStatus = status;
    }

    const resources = await prisma.academicResource.findMany({
      where,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        institution: true,
        faculty: true,
        filiere: true,
        academicLevel: true,
        accessPolicy: true,
        media: true,
      },
      orderBy: [
        { priorityScore: 'desc' },
        { reminderCount: 'desc' },
        { lastReminderAt: 'desc' },
        { submittedAt: 'asc' },
      ],
    });

    const counts = {
      pending: await prisma.academicResource.count({ where: { validationStatus: 'PENDING' } }),
      approved: await prisma.academicResource.count({ where: { validationStatus: 'APPROVED' } }),
      rejected: await prisma.academicResource.count({ where: { validationStatus: 'REJECTED' } }),
      withReminder: await prisma.academicResource.count({
        where: { validationStatus: 'PENDING', reminderCount: { gt: 0 } },
      }),
    };

    return NextResponse.json({
      success: true,
      resources,
      counts,
    });
  } catch (error) {
    console.error('API Error /admin/validations (GET):', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des validations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId, action, validationNote, validatedBy } = body;

    if (!resourceId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Identifiant de ressource et action (APPROVE/REJECT) requis.' },
        { status: 400 }
      );
    }

    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        author: { include: { profile: true } },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    const isApprove = action === 'APPROVE';
    const updated = await prisma.academicResource.update({
      where: { id: resourceId },
      data: {
        validationStatus: isApprove ? 'APPROVED' : 'REJECTED',
        validationNote: validationNote || null,
        validatedAt: new Date(),
        validatedBy: validatedBy || 'Admin Campus Folder',
        isCertified: isApprove ? true : resource.isCertified,
      },
    });

    const author = resource.author;
    const authorName = author?.profile
      ? `${author.profile.firstName} ${author.profile.lastName}`
      : 'Auteur';

    if (author?.email) {
      if (isApprove) {
        sendResourceApprovedEmail({
          userId: author.id,
          to: author.email,
          authorName,
          resourceTitle: resource.title,
          resourceSlug: resource.slug,
        }).catch((err) => console.error('[EMAIL ERROR - APPROVE]', err));
      } else {
        sendResourceRejectedEmail({
          userId: author.id,
          to: author.email,
          authorName,
          resourceTitle: resource.title,
          rejectionReason: validationNote || 'Non conformité avec les critères de la charte académique.',
        }).catch((err) => console.error('[EMAIL ERROR - REJECT]', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: isApprove
        ? 'Ressource validée et publiée avec succès !'
        : 'Ressource refusée. L’auteur a été notifié par email.',
      resource: updated,
    });
  } catch (error) {
    console.error('API Error /admin/validations (POST):', error);
    return NextResponse.json({ error: 'Erreur lors de la validation de la ressource' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId, justification, adminName } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Identifiant de la ressource requis.' },
        { status: 400 }
      );
    }

    if (!justification || typeof justification !== 'string' || justification.trim().length < 5) {
      return NextResponse.json(
        { error: 'Une justification explicite (au moins 5 caractères) est obligatoire pour supprimer définitivement une publication académique.' },
        { status: 400 }
      );
    }

    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    const safeAdminName = adminName || 'Administration Campus Folder';

    // 1. Audit log on author history
    await prisma.activityLog.create({
      data: {
        userId: resource.authorId,
        action: 'ADMIN_RESOURCE_PERMANENTLY_DELETED',
        title: `Publication supprimée par l'administration : ${resource.title}`,
        category: 'ACADEMIC',
        metadata: JSON.stringify({
          justification: justification.trim(),
          admin: safeAdminName,
        }),
      },
    });

    // 2. Cascade delete publication
    await prisma.academicResource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({
      success: true,
      message: `Publication "${resource.title}" supprimée définitivement avec justification archivée au registre d'audit.`,
    });
  } catch (error) {
    console.error('API Error /admin/validations (DELETE):', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression définitive de la ressource' },
      { status: 500 }
    );
  }
}

