import { NextRequest } from 'next/server';
import { realTimeBus } from '@/lib/messaging/event-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const encoder = new TextEncoder();
  const channel = `conv:${conversationId}`;

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialPayload = `event: connected\ndata: ${JSON.stringify({
        connected: true,
        conversationId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Listener for room events
      const onEvent = (eventData: any) => {
        try {
          const sseMsg = `event: ${eventData.eventType}\ndata: ${JSON.stringify(eventData.data)}\n\n`;
          controller.enqueue(encoder.encode(sseMsg));
        } catch (e) {
          console.error('Error streaming event:', e);
        }
      };

      realTimeBus.on(channel, onEvent);

      // Heartbeat every 15s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        realTimeBus.off(channel, onEvent);
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
