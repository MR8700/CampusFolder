import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mediaType = (formData.get('mediaType') as string) || 'PDF';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (mediaType === 'AUDIO' ? '.mp3' : '.pdf');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        originalFilename: file.name,
        storagePath: `/uploads/${safeName}`,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: buffer.length,
        mediaType,
      },
    });
  } catch (error) {
    console.error('API Error /resources/upload:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
