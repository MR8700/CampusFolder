import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { ResourceSharingService } from '@/lib/messaging/resource-sharing-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: resourceId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const check = await ResourceSharingService.checkResourceAccess(user.id, resourceId);

    return NextResponse.json({
      success: true,
      check,
    });
  } catch (error: any) {
    console.error('API Error GET /resources/[id]/access-check:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
