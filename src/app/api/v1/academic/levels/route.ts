import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const levels = await prisma.academicLevel.findMany({
      orderBy: {
        rank: 'asc',
      },
    });

    return NextResponse.json({ success: true, levels });
  } catch (error) {
    console.error('API Error /academic/levels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
