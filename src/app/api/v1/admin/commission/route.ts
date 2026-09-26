import { NextRequest, NextResponse } from 'next/server';
import { getCommissionSettings, updateCommissionSettings } from '@/lib/config/commission';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getCommissionSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error GET /api/v1/admin/commission:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les paramètres de commission' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { platformCommissionPercent, updatedBy } = body;

    if (platformCommissionPercent === undefined || isNaN(Number(platformCommissionPercent))) {
      return NextResponse.json(
        { success: false, error: 'Le taux de commission de la plateforme est obligatoire.' },
        { status: 400 }
      );
    }

    const rate = Number(platformCommissionPercent);
    if (rate < 0 || rate > 100) {
      return NextResponse.json(
        { success: false, error: 'Le taux de commission doit être compris entre 0% et 100%.' },
        { status: 400 }
      );
    }

    const updated = await updateCommissionSettings(rate, updatedBy || 'SUPER_ADMIN');

    // Create Audit Log
    try {
      const adminUser = await prisma.user.findFirst({
        where: { isSuperAdmin: true },
      });
      if (adminUser) {
        await prisma.activityLog.create({
          data: {
            userId: adminUser.id,
            action: 'SETTINGS_UPDATED',
            title: `Mise à jour commission plateforme : ${updated.platformCommissionPercent}% (Auteur: ${updated.authorRoyaltyPercent}%)`,
            category: 'COMMERCE',
            metadata: JSON.stringify(updated),
          },
        });
      }
    } catch (auditErr) {
      console.warn('Audit log creation warning:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Paramétrage de commission mis à jour avec succès : Plateforme ${updated.platformCommissionPercent}% / Auteur ${updated.authorRoyaltyPercent}%.`,
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error PATCH /api/v1/admin/commission:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des paramètres de commission' },
      { status: 500 }
    );
  }
}
