import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logUserActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

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
      notifyEmailAll,
      notifyOnPurchase,
      notifyOnSale,
      notifyOnDownload,
      notifyOnPublish,
      notifyOnWithdrawal,
    } = body;

    const updateData: Record<string, boolean> = {};
    if (typeof notifyEmailAll === 'boolean') updateData.notifyEmailAll = notifyEmailAll;
    if (typeof notifyOnPurchase === 'boolean') updateData.notifyOnPurchase = notifyOnPurchase;
    if (typeof notifyOnSale === 'boolean') updateData.notifyOnSale = notifyOnSale;
    if (typeof notifyOnDownload === 'boolean') updateData.notifyOnDownload = notifyOnDownload;
    if (typeof notifyOnPublish === 'boolean') updateData.notifyOnPublish = notifyOnPublish;
    if (typeof notifyOnWithdrawal === 'boolean') updateData.notifyOnWithdrawal = notifyOnWithdrawal;

    const updatedUser = await prisma.user.update({
      where: { id: sessionUserId },
      data: updateData,
      select: {
        id: true,
        notifyEmailAll: true,
        notifyOnPurchase: true,
        notifyOnSale: true,
        notifyOnDownload: true,
        notifyOnPublish: true,
        notifyOnWithdrawal: true,
      },
    });

    await logUserActivity({
      userId: sessionUserId,
      action: 'SETTINGS_UPDATED',
      title: 'Mise à jour des préférences de notification',
      category: 'SETTINGS',
      metadata: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences de notifications enregistrées.',
      settings: updatedUser,
    });
  } catch (error: any) {
    console.error('Error PATCH /api/v1/user/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des paramètres.' },
      { status: 500 }
    );
  }
}
