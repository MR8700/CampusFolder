import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      where: { isArchived: false },
      include: {
        faculties: {
          where: { isArchived: false },
          include: {
            filieres: {
              where: { isArchived: false },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Group institutions by official Burkina Faso region
    const regionsMap: Record<string, any> = {};

    const REGIONS_ORDER = [
      'Centre',
      'Hauts-Bassins',
      'Centre-Ouest',
      'Boucle du Mouhoun',
      'Est',
      'Nord',
      'Centre-Sud',
      'Plateau-Central',
      'Cascades',
      'Sud-Ouest',
      'Centre-Nord',
      'Centre-Est',
      'Sahel',
    ];

    REGIONS_ORDER.forEach((reg) => {
      regionsMap[reg] = {
        name: reg,
        institutionsCount: 0,
        institutions: [],
      };
    });

    institutions.forEach((inst) => {
      const regionKey = inst.region || 'Centre';
      if (!regionsMap[regionKey]) {
        regionsMap[regionKey] = {
          name: regionKey,
          institutionsCount: 0,
          institutions: [],
        };
      }
      regionsMap[regionKey].institutions.push({
        id: inst.id,
        name: inst.name,
        shortName: inst.shortName,
        city: inst.city,
        type: inst.type,
        category: inst.category,
        logoUrl: inst.logoUrl,
        facultiesCount: inst.faculties.length,
        studentsCount: inst.activeStudentsCount,
        isLive: inst.isLive,
      });
      regionsMap[regionKey].institutionsCount++;
    });

    const regions = Object.values(regionsMap);

    return NextResponse.json({
      success: true,
      country: 'Burkina Faso',
      flag: '🇧🇫',
      totalInstitutions: institutions.length,
      regions,
    });
  } catch (error: any) {
    console.error('Error GET /academic/regions:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des régions' }, { status: 500 });
  }
}
