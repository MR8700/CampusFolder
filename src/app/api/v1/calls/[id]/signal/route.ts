import { NextRequest, NextResponse } from 'next/server';
import { realTimeBus } from '@/lib/messaging/event-bus';
import { getSessionUser } from '@/lib/messaging/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: channelName } = await params;

  const encoder = new TextEncoder();
  const channel = `call:${channelName}`;

  const customReadable = new ReadableStream({
    start(controller) {
      const initialPayload = `event: connected\ndata: ${JSON.stringify({
        connected: true,
        channelName,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      const onSignal = (eventData: any) => {
        try {
          const sseMsg = `event: ${eventData.eventType}\ndata: ${JSON.stringify(eventData.data)}\n\n`;
          controller.enqueue(encoder.encode(sseMsg));
        } catch (e) {
          console.error('Error streaming signal:', e);
        }
      };

      realTimeBus.on(channel, onSignal);

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        realTimeBus.off(channel, onSignal);
        controller.close();
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: channelName } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { type, candidate, sdp, targetUserId } = body;

    // Broadcast signal to participants in this call channel
    realTimeBus.emitToCallRoom(channelName, type, {
      fromUserId: user.id,
      fromUserName: user.profile?.displayName || 'Camarade',
      targetUserId,
      sdp,
      candidate,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error POST /calls/[id]/signal:', error);
    return NextResponse.json({ error: error.message || 'Erreur de signalement' }, { status: 500 });
  }
}
