import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facultyId, name, code, degreeLevel, description } = body;

    if (!facultyId || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'L’UFR de rattachement, le nom de la filière et son code sont obligatoires.' },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.create({
      data: {
        facultyId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        degreeLevel: degreeLevel || 'LICENCE',
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Filière ajoutée avec succès.',
      filiere,
    });
  } catch (error: any) {
    console.error('Error POST /admin/filieres:', error);
    return NextResponse.json({ success: false, error: 'Erreur création filière' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID filière requis' }, { status: 400 });
    }

    const updated = await prisma.filiere.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.code && { code: updates.code.trim().toUpperCase() }),
        ...(updates.degreeLevel && { degreeLevel: updates.degreeLevel }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.isArchived !== undefined && { isArchived: Boolean(updates.isArchived) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Filière mise à jour avec succès.',
      filiere: updated,
    });
  } catch (error: any) {
    console.error('Error PATCH /admin/filieres:', error);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour filière' }, { status: 500 });
  }
}
