import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let extension = '.jpg';
    let mimeType = 'image/jpeg';
    let subfolder = 'images';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const targetFolder = (formData.get('folder') as string) || 'images';
      if (['logos', 'avatars', 'covers', 'documents'].includes(targetFolder)) {
        subfolder = targetFolder;
      }

      if (!file) {
        return NextResponse.json({ success: false, error: 'Aucun fichier image reçu.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      mimeType = file.type || 'image/jpeg';

      if (mimeType.includes('png')) extension = '.png';
      else if (mimeType.includes('webp')) extension = '.webp';
      else if (mimeType.includes('svg')) extension = '.svg';
      else if (mimeType.includes('gif')) extension = '.gif';
      else extension = '.jpg';
    } else {
      // JSON with base64 dataUrl
      const body = await req.json();
      const { dataUrl, folder } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'Données image (dataUrl) manquantes.' }, { status: 400 });
      }

      if (folder && ['logos', 'avatars', 'covers', 'documents'].includes(folder)) {
        subfolder = folder;
      }

      // Format: data:image/jpeg;base64,...
      const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ success: false, error: 'Format base64 invalide.' }, { status: 400 });
      }

      mimeType = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, 'base64');

      if (mimeType.includes('png')) extension = '.png';
      else if (mimeType.includes('webp')) extension = '.webp';
      else if (mimeType.includes('svg')) extension = '.svg';
      else if (mimeType.includes('gif')) extension = '.gif';
      else extension = '.jpg';
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${subfolder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${extension}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${subfolder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      mimeType,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('API Error /upload/image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’enregistrement de l’image' },
      { status: 500 }
    );
  }
}
