import { NextResponse } from 'next/server';

export async function POST() {
  // Production security: Quick-login bypass is permanently decommissioned.
  return NextResponse.json(
    { success: false, error: 'Bypass de connexion désactivé en production. Veuillez vous authentifier officiellement.' },
    { status: 403 }
  );
}
