import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find entitlement or fallback to demo token CF-8921-UJKZ-SSL
    let entitlement = await prisma.entitlement.findFirst({
      where: {
        OR: [{ downloadToken: token }, { downloadToken: 'CF-8921-UJKZ-SSL' }],
      },
      include: {
        user: { include: { profile: true } },
        resource: {
          include: {
            author: { include: { profile: true } },
            faculty: true,
            academicLevel: true,
            media: true,
          },
        },
      },
    });

    if (!entitlement) {
      // Return demo resource if no entitlement found
      const resource = await prisma.academicResource.findFirst({
        where: { slug: 'corrige-examen-synthese-linguistique-generale-l1' },
        include: {
          author: { include: { profile: true } },
          faculty: true,
          academicLevel: true,
          media: true,
        },
      });

      if (!resource) {
        return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        document: {
          title: resource.title,
          academicLevel: resource.academicLevel.code,
          faculty: resource.faculty.name,
          licenseId: '#CF-8921',
          totalPages: resource.pageCount || 14,
          watermarkText: 'KOUASSI A. • ID #CF-8921 • UJKZ • USAGE STRICTEMENT PERSONNEL',
          shaFingerprint: '7c89f92e811c03bf8921e102837bc901a89f92e811c03bf8921e102837bc901a',
          voiceNote: {
            authorName: resource.author.profile?.displayName || 'Moussa O.',
            title: 'Note Vocale du Major',
            description: 'Explication dérivation & méthode de transcription',
            duration: '02:14 / 08:42',
          },
          formulaTitle: '1. Formule de Référence IS-LM :',
          formulaEquation: 'Y = C(Y - T) + I(Y, i) + G\nM / P = L(Y, i)',
          professorNote: 'Toujours dériver selon i avant d’injecter le multiplicateur budgétaire. Piège classique de l’examen final !',
          whatsappGroup: {
            name: 'Groupe WhatsApp de l’Amphi B',
            membersCount: 182,
            url: 'https://chat.whatsapp.com/demo-campus-folder',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: {
        title: entitlement.resource.title,
        academicLevel: entitlement.resource.academicLevel.code,
        faculty: entitlement.resource.faculty.name,
        licenseId: '#CF-8921',
        totalPages: entitlement.resource.pageCount || 14,
        watermarkText: `${entitlement.user.profile?.displayName || 'KOUASSI A.'} • ID #CF-8921 • UJKZ • USAGE STRICTEMENT PERSONNEL`,
        shaFingerprint: '7c89f92e811c03bf8921e102837bc901a89f92e811c03bf8921e102837bc901a',
        voiceNote: {
          authorName: entitlement.resource.author.profile?.displayName || 'Moussa O.',
          title: 'Note Vocale du Major',
          description: 'Explication dérivation équation (3)',
          duration: '02:14 / 06:40',
        },
        formulaTitle: '1. Formule de Référence IS-LM :',
        formulaEquation: 'Y = C(Y - T) + I(Y, i) + G\nM / P = L(Y, i)',
        professorNote: 'Toujours dériver selon i avant d’injecter le multiplicateur budgétaire. Piège classique de l’examen final !',
        whatsappGroup: {
          name: 'Groupe WhatsApp de l’Amphi B',
          membersCount: 182,
          url: 'https://chat.whatsapp.com/demo-campus-folder',
        },
      },
    });
  } catch (error) {
    console.error('API Error /reader/[token]:', error);
    return NextResponse.json({ error: 'Erreur session de lecture' }, { status: 500 });
  }
}
