import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyPassword, validatePassword, hashPassword } from '@/lib/auth';
import { logUserActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Veuillez renseigner tous les champs requis.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    // 1. Verify current password
    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe actuel est incorrect.' },
        { status: 400 }
      );
    }

    // 2. Strict validation of new password
    const validationResult = validatePassword(newPassword);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Mot de passe invalide : ${validationResult.feedback.join(' ')}`,
          criteria: validationResult.criteria,
        },
        { status: 400 }
      );
    }

    // 3. Hash and update
    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: sessionUserId },
      data: {
        passwordHash: newHash,
        updatedAt: new Date(),
      },
    });

    // 4. Log Activity
    await logUserActivity({
      userId: sessionUserId,
      action: 'PASSWORD_CHANGED',
      title: 'Modification sécurisée du mot de passe',
      category: 'SECURITY',
    });

    return NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès.',
    });
  } catch (error: any) {
    console.error('Error POST /api/v1/user/change-password:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du changement de mot de passe.' },
      { status: 500 }
    );
  }
}
