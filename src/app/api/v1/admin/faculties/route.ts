import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { institutionId, name, code, iconName, logoUrl, description } = body;

    if (!institutionId || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'L’institution, le nom de l’UFR et son code sont obligatoires.' },
        { status: 400 }
      );
    }

    const faculty = await prisma.faculty.create({
      data: {
        institutionId,
        name: name.trim(),
        code: code.trim().toLowerCase(),
        iconName: iconName || 'school',
        logoUrl: logoUrl || null,
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'UFR ou Faculté ajoutée avec succès.',
      faculty,
    });
  } catch (error: any) {
    console.error('Error POST /admin/faculties:', error);
    return NextResponse.json({ success: false, error: 'Erreur création UFR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID UFR requis' }, { status: 400 });
    }

    const updated = await prisma.faculty.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.code && { code: updates.code.trim().toLowerCase() }),
        ...(updates.iconName && { iconName: updates.iconName.trim() }),
        ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.isArchived !== undefined && { isArchived: Boolean(updates.isArchived) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'UFR mise à jour avec succès.',
      faculty: updated,
    });
  } catch (error: any) {
    console.error('Error PATCH /admin/faculties:', error);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour UFR' }, { status: 500 });
  }
}
