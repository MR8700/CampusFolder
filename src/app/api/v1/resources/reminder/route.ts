import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminReminderAlertEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json({ error: 'Identifiant de ressource requis' }, { status: 400 });
    }

    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        author: { include: { profile: true } },
        institution: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    if (resource.validationStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cette ressource a déjà été validée et est active en ligne.' },
        { status: 400 }
      );
    }

    // Increment reminder counter, update timestamp and bump priority score
    const newCount = (resource.reminderCount || 0) + 1;
    const newPriority = (resource.priorityScore || 1) + 10;

    const updated = await prisma.academicResource.update({
      where: { id: resourceId },
      data: {
        reminderCount: newCount,
        lastReminderAt: new Date(),
        priorityScore: newPriority,
      },
    });

    // Notify administrators
    const studentName = resource.author?.profile
      ? `${resource.author.profile.firstName} ${resource.author.profile.lastName}`
      : 'Étudiant';

    sendAdminReminderAlertEmail({
      adminEmail: 'admin@campusfolder.bf',
      studentName,
      resourceTitle: resource.title,
      reminderCount: newCount,
      resourceId: resource.id,
    }).catch((err) => console.error('[EMAIL ERROR - REMINDER TO ADMIN]', err));

    return NextResponse.json({
      success: true,
      message: `Rappel #${newCount} transmis avec succès. Votre ressource a été reclassée en priorité d'examen chez l'administrateur.`,
      reminderCount: newCount,
      priorityScore: newPriority,
    });
  } catch (error) {
    console.error('API Error /resources/reminder:', error);
    return NextResponse.json({ error: 'Erreur lors de l’envoi du rappel' }, { status: 500 });
  }
}
