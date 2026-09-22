import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Production security: Simulation endpoints are permanently decommissioned.
  return NextResponse.json(
    { success: false, error: 'Endpoint decommissioned in production.' },
    { status: 404 }
  );
}
