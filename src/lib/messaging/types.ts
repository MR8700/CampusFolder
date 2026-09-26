export type ConversationType =
  | 'DIRECT'
  | 'GROUP'
  | 'ACADEMIC_GROUP'
  | 'RESOURCE_CONTEXT'
  | 'COURSE_CLASS'
  | 'PROMOTION'
  | 'STUDY_GROUP'
  | 'SUPPORT'
  | 'SYSTEM';

export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'READ_ONLY';

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'RESOURCE'
  | 'VOICE_NOTE'
  | 'LOCATION'
  | 'CONTACT'
  | 'CALL_EVENT'
  | 'SYSTEM'
  | 'REACTION'
  | 'POLL';

export type CallType = 'VOICE' | 'VIDEO';

export type CallStatus =
  | 'CREATED'
  | 'RINGING'
  | 'ACTIVE'
  | 'ENDING'
  | 'ENDED'
  | 'FAILED'
  | 'CANCELLED';

export type CallRole = 'HOST' | 'CO_HOST' | 'MODERATOR' | 'SPEAKER' | 'PARTICIPANT' | 'OBSERVER';

export type PresenceStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'AWAY'
  | 'BUSY'
  | 'IN_CALL'
  | 'DO_NOT_DISTURB';

export interface CreateConversationDto {
  type?: ConversationType;
  title?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
  contextType?: 'RESOURCE' | 'COURSE' | 'MODULE' | 'FILIERE' | 'INSTITUTION' | 'CALL';
  resourceId?: string;
  contextMetadata?: Record<string, any>;
}

export interface SendMessageDto {
  conversationId: string;
  type?: MessageType;
  text?: string;
  replyToMessageId?: string;
  resourceId?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  voiceNote?: {
    audioUrl: string;
    durationSeconds: number;
    durationMs: number;
    waveform?: number[];
  };
  metadata?: Record<string, any>;
}

export interface ResourceAttachmentPayload {
  resourceId: string;
  title: string;
  slug: string;
  facultyName?: string;
  thumbnailUrl?: string;
  pageCount?: number;
  badgeQuality?: string;
  authorName?: string;
  isPaid: boolean;
  priceAmount: number;
  currency: string;
  isUserEntitled: boolean;
  downloadToken?: string | null;
}

export interface CallInitiateDto {
  conversationId?: string;
  recipientId?: string;
  type: CallType;
  isGroup?: boolean;
  title?: string;
  isMonetized?: boolean;
  ticketPrice?: number;
}
