import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const institutionId = searchParams.get('institutionId');

    const where: Record<string, any> = {};

    if (q.trim()) {
      const term = q.trim();
      where.OR = [
        { email: { contains: term } },
        { ine: { contains: term } },
        { profile: { firstName: { contains: term } } },
        { profile: { lastName: { contains: term } } },
        { profile: { displayName: { contains: term } } },
      ];
    }

    if (institutionId && institutionId !== 'all') {
      where.profile = {
        ...where.profile,
        institutionId,
      };
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        ine: true,
        phoneNumber: true,
        status: true,
        isSuspended: true,
        suspensionReason: true,
        points: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            city: true,
            filiere: true,
            institution: {
              select: {
                id: true,
                name: true,
                shortName: true,
                region: true,
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
                code: true,
                label: true,
              },
            },
          },
        },
        _count: {
          select: {
            resources: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      students,
      total: students.length,
    });
  } catch (error: any) {
    console.error('Error GET /admin/students:', error);
    return NextResponse.json({ success: false, error: 'Erreur chargement des étudiants' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      id,
      firstName,
      lastName,
      displayName,
      email,
      ine,
      phoneNumber,
      points,
      institutionId,
      facultyId,
      filiere,
      city,
      region,
      avatarUrl,
      isSuspended,
      suspensionReason,
      status,
    } = body;

    const targetUserId = userId || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'Identifiant étudiant requis' }, { status: 400 });
    }

    // 1. Update User table
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { points: true, email: true },
    });

    const userData: Record<string, any> = {};
    if (isSuspended !== undefined) userData.isSuspended = Boolean(isSuspended);
    if (suspensionReason !== undefined) userData.suspensionReason = suspensionReason;
    if (status) userData.status = status;
    if (email !== undefined && email.trim()) userData.email = email.trim().toLowerCase();
    if (ine !== undefined && ine.trim()) userData.ine = ine.trim().toUpperCase();
    if (phoneNumber !== undefined) userData.phoneNumber = phoneNumber.trim();
    
    if (points !== undefined) {
      const newPoints = Math.max(0, Number(points));
      userData.points = newPoints;

      const oldPoints = existingUser?.points ?? 0;
      if (newPoints !== oldPoints) {
        const justification = (body.pointsJustification || "Attribution de points en faveur de la qualité et rigueur du contenu pédagogique").trim();
        const diff = newPoints - oldPoints;

        await prisma.activityLog.create({
          data: {
            userId: targetUserId,
            action: 'ADMIN_POINTS_ADJUSTMENT',
            title: `Attribution de points amphi (${diff >= 0 ? '+' : ''}${diff} pts)`,
            category: 'ACADEMIC',
            metadata: JSON.stringify({
              oldPoints,
              newPoints,
              diff,
              justification,
              adjustedAt: new Date().toISOString(),
            }),
          },
        }).catch((err) => console.error('[ACTIVITY LOG ERROR]', err));
      }
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: userData,
      });
    }

    // 2. Update Profile table
    const profileData: Record<string, any> = {};
    if (firstName !== undefined) profileData.firstName = firstName.trim();
    if (lastName !== undefined) profileData.lastName = lastName.trim();
    if (displayName !== undefined) profileData.displayName = displayName.trim();
    if (institutionId !== undefined) profileData.institutionId = institutionId || null;
    if (facultyId !== undefined) profileData.facultyId = facultyId || null;
    if (filiere !== undefined) profileData.filiere = filiere.trim();
    if (city !== undefined) profileData.city = city.trim();
    if (region !== undefined) profileData.region = region.trim();
    if (avatarUrl !== undefined) profileData.avatarUrl = avatarUrl;

    if (Object.keys(profileData).length > 0) {
      await prisma.profile.update({
        where: { userId: targetUserId },
        data: profileData,
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dossier étudiant mis à jour avec succès par l'administrateur.",
      student: fullUser,
    });
  } catch (error: any) {
    console.error('Error PATCH /admin/students:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la modification du profil étudiant' }, { status: 500 });
  }
}
