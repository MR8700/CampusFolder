import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logUserActivity } from '@/lib/activity';

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

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        profile: {
          include: {
            institution: {
              include: { country: true },
            },
            faculty: true,
            academicLevel: true,
          },
        },
        wallet: true,
        roles: {
          include: { role: true },
        },
        _count: {
          select: {
            orders: { where: { status: 'PAID' } },
            resources: true,
            entitlements: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        ine: user.ine,
        email: user.email,
        phoneNumber: user.phoneNumber,
        points: user.points,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isSuperAdmin: Boolean(user.isSuperAdmin),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        notifyEmailAll: user.notifyEmailAll,
        notifyOnPurchase: user.notifyOnPurchase,
        notifyOnSale: user.notifyOnSale,
        notifyOnDownload: user.notifyOnDownload,
        notifyOnPublish: user.notifyOnPublish,
        notifyOnWithdrawal: user.notifyOnWithdrawal,
        profile: user.profile,
        wallet: user.wallet,
        roles: user.roles.map((r) => r.role.code || r.role.name),
        counts: {
          purchasedDocs: user._count.orders,
          publishedDocs: user._count.resources,
          entitlements: user._count.entitlements,
        },
      },
    });
  } catch (error: any) {
    console.error('Error GET /api/v1/user/profile:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement du profil.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      displayName,
      phoneNumber,
      bio,
      region,
      city,
      address,
      institutionId,
      facultyId,
      academicLevelId,
      filiere,
      avatarUrl,
    } = body;

    // Check user role and privileges
    const callingUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!callingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    const isAdmin =
      Boolean(callingUser.isSuperAdmin) ||
      callingUser.email === 'admin@campusfolder.bf' ||
      callingUser.roles.some(
        (r) =>
          r.role.code === 'ADMIN' ||
          r.role.name === 'ADMIN' ||
          r.role.name === 'Administrateur'
      );

    // Rule: Students CANNOT modify their university of affiliation once set during registration.
    if (
      !isAdmin &&
      institutionId !== undefined &&
      callingUser.profile?.institutionId &&
      institutionId !== callingUser.profile.institutionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "L'université d'appartenance est définitivement scellée lors de l'inscription officielle et ne peut être modifiée que par l'administration de Campus Folder.",
        },
        { status: 403 }
      );
    }

    // 1. Update user if phoneNumber provided
    if (phoneNumber !== undefined) {
      const cleanPhone = phoneNumber.trim();
      await prisma.user.update({
        where: { id: sessionUserId },
        data: { phoneNumber: cleanPhone },
      });
    }

    // 2. Prepare profile updates
    const updateData: Record<string, any> = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (region !== undefined) updateData.region = region.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (institutionId !== undefined && (isAdmin || !callingUser.profile?.institutionId)) {
      updateData.institutionId = institutionId || null;
    }
    if (facultyId !== undefined) updateData.facultyId = facultyId || null;
    if (academicLevelId !== undefined) updateData.academicLevelId = academicLevelId || null;
    if (filiere !== undefined) updateData.filiere = filiere.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();

    const updatedProfile = await prisma.profile.update({
      where: { userId: sessionUserId },
      data: updateData,
      include: {
        institution: {
          include: { country: true },
        },
        faculty: true,
        academicLevel: true,
      },
    });

    // 3. Log Activity
    await logUserActivity({
      userId: sessionUserId,
      action: 'PROFILE_UPDATE',
      title: 'Mise à jour des informations personnelles',
      category: 'SETTINGS',
      metadata: { fieldsUpdated: Object.keys(updateData) },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil et informations personnelles enregistrés avec succès.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error PATCH /api/v1/user/profile:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du profil.' },
      { status: 500 }
    );
  }
}
