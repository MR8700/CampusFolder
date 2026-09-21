import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docType = searchParams.get('documentType');

    const where: Record<string, any> = {};
    if (docType && docType !== 'all') {
      where.documentType = docType;
    }

    const rules = await prisma.pricingCeilingRule.findMany({
      where,
      orderBy: { maxPrice: 'desc' },
    });

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    console.error('Error GET /admin/pricing-rules:', error);
    return NextResponse.json({ success: false, error: 'Erreur chargement des barèmes tarifaires' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      documentType,
      mediaFormat,
      minPrice,
      maxPrice,
      suggestedPrice,
      institutionId,
      facultyId,
      filiereId,
      targetUserId,
      notes,
    } = body;

    if (!title || maxPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Le titre et le prix plafond maximum (maxPrice) sont obligatoires.' },
        { status: 400 }
      );
    }

    const newRule = await prisma.pricingCeilingRule.create({
      data: {
        title: title.trim(),
        documentType: documentType || 'ALL',
        mediaFormat: mediaFormat || 'ALL',
        minPrice: Number(minPrice) || 0,
        maxPrice: Number(maxPrice),
        suggestedPrice: Number(suggestedPrice) || Math.round(Number(maxPrice) * 0.4),
        institutionId: institutionId || null,
        facultyId: facultyId || null,
        filiereId: filiereId || null,
        targetUserId: targetUserId || null,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Barème tarifaire administratif créé avec succès.',
      rule: newRule,
    });
  } catch (error: any) {
    console.error('Error POST /admin/pricing-rules:', error);
    return NextResponse.json({ success: false, error: 'Erreur création du barème' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Identifiant du barème requis' }, { status: 400 });
    }

    const updatedRule = await prisma.pricingCeilingRule.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title.trim() }),
        ...(updates.minPrice !== undefined && { minPrice: Number(updates.minPrice) }),
        ...(updates.maxPrice !== undefined && { maxPrice: Number(updates.maxPrice) }),
        ...(updates.suggestedPrice !== undefined && { suggestedPrice: Number(updates.suggestedPrice) }),
        ...(updates.documentType !== undefined && { documentType: updates.documentType }),
        ...(updates.mediaFormat !== undefined && { mediaFormat: updates.mediaFormat }),
        ...(updates.isActive !== undefined && { isActive: Boolean(updates.isActive) }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Barème tarifaire mis à jour avec succès.',
      rule: updatedRule,
    });
  } catch (error: any) {
    console.error('Error PATCH /admin/pricing-rules:', error);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour du barème' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });
    }

    await prisma.pricingCeilingRule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Barème tarifaire supprimé avec succès.',
    });
  } catch (error: any) {
    console.error('Error DELETE /admin/pricing-rules:', error);
    return NextResponse.json({ success: false, error: 'Erreur suppression du barème' }, { status: 500 });
  }
}
