import { EventEmitter } from 'events';

export type EventType =
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'message.read'
  | 'message.reaction'
  | 'presence.updated'
  | 'call.created'
  | 'call.ringing'
  | 'call.accepted'
  | 'call.rejected'
  | 'call.participant.joined'
  | 'call.participant.left'
  | 'call.ended'
  | 'screen-share.started'
  | 'screen-share.stopped';

class RealTimeBus extends EventEmitter {
  private static instance: RealTimeBus;

  private constructor() {
    super();
    this.setMaxListeners(200);
  }

  public static getInstance(): RealTimeBus {
    if (!RealTimeBus.instance) {
      RealTimeBus.instance = new RealTimeBus();
    }
    return RealTimeBus.instance;
  }

  /**
   * Broadcast an event to a specific conversation room
   */
  emitToConversation(conversationId: string, eventType: EventType, data: any) {
    this.emit(`conv:${conversationId}`, { eventType, data, timestamp: new Date().toISOString() });
    this.emit('global', { channel: `conv:${conversationId}`, eventType, data });
  }

  /**
   * Broadcast an event to a specific user (e.g. incoming call, mention)
   */
  emitToUser(userId: string, eventType: EventType, data: any) {
    this.emit(`user:${userId}`, { eventType, data, timestamp: new Date().toISOString() });
  }

  /**
   * Broadcast call signaling events to room participants
   */
  emitToCallRoom(channelName: string, eventType: EventType, data: any) {
    this.emit(`call:${channelName}`, { eventType, data, timestamp: new Date().toISOString() });
  }
}

export const realTimeBus = RealTimeBus.getInstance();
