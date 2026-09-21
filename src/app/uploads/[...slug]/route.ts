import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return new NextResponse('Fichier introuvable', { status: 404 });
    }

    const safeRelativePath = path.join(...slug);
    // Prevent path traversal
    if (safeRelativePath.includes('..')) {
      return new NextResponse('Accès refusé', { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', safeRelativePath);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Fichier introuvable', { status: 404 });
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return new NextResponse('Ressource non valide', { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload:', error);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
}
