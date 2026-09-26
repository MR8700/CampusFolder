import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/messaging/auth-helper';
import { MessagingService } from '@/lib/messaging/messaging-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 50);

    const result = await MessagingService.getConversationMessages(conversationId, user.id, cursor, limit);

    return NextResponse.json({
      success: true,
      messages: result.messages,
      nextCursor: result.nextCursor,
    });
  } catch (error: any) {
    console.error('API Error GET /conversations/[id]/messages:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type = 'TEXT',
      text,
      replyToMessageId,
      resourceId,
      voiceNote,
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      metadata,
    } = body;

    const message = await MessagingService.sendMessage(user.id, {
      conversationId,
      type,
      text,
      replyToMessageId,
      resourceId,
      voiceNote,
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('API Error POST /conversations/[id]/messages:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
