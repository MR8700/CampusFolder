import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { CallingService } from '@/lib/messaging/calling-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: callOfferId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const purchase = await CallingService.purchaseCallTicket(user.id, callOfferId);

    return NextResponse.json({
      success: true,
      message: 'Billet pour la conférence réservé avec succès !',
      purchase,
    });
  } catch (error: any) {
    console.error('API Error POST /calls/[id]/purchase:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l’acquisition du billet' }, { status: 500 });
  }
}
