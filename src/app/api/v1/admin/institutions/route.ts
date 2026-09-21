import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      shortName,
      type,
      category,
      region,
      city,
      logoUrl,
      websiteUrl,
    } = body;

    if (!name || !shortName) {
      return NextResponse.json(
        { success: false, error: 'Le nom officiel et le sigle/nom court sont requis.' },
        { status: 400 }
      );
    }

    // Default to country BF
    let country = await prisma.country.findFirst({ where: { isoCode: 'BF' } });
    if (!country) {
      country = await prisma.country.create({
        data: { isoCode: 'BF', name: 'Burkina Faso', phoneCode: '+226', flagEmoji: '🇧🇫' },
      });
    }

    const institution = await prisma.institution.create({
      data: {
        countryId: country.id,
        name: name.trim(),
        shortName: shortName.trim(),
        type: type || 'PUBLIC_UNIVERSITY',
        category: category || 'UNIVERSITE_PUBLIQUE',
        region: region || 'Centre',
        city: city ? city.trim() : 'Ouagadougou',
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
        isLive: true,
        isArchived: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Université ou établissement ajouté avec succès.',
      institution,
    });
  } catch (error: any) {
    console.error('Error POST /admin/institutions:', error);
    return NextResponse.json({ success: false, error: 'Erreur création établissement' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.shortName && { shortName: updates.shortName.trim() }),
        ...(updates.region && { region: updates.region }),
        ...(updates.city && { city: updates.city.trim() }),
        ...(updates.category && { category: updates.category }),
        ...(updates.type && { type: updates.type }),
        ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
        ...(updates.websiteUrl !== undefined && { websiteUrl: updates.websiteUrl }),
        ...(updates.isLive !== undefined && { isLive: Boolean(updates.isLive) }),
        ...(updates.isArchived !== undefined && { isArchived: Boolean(updates.isArchived) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Établissement mis à jour avec succès.',
      institution: updated,
    });
  } catch (error: any) {
    console.error('Error PATCH /admin/institutions:', error);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour établissement' }, { status: 500 });
  }
}
