export type MessageSender = 'me' | 'other';

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  /** Texte ; vide si message uniquement vocal. */
  text: string;
  time: string;
  /** Data URL audio (ex. webm) pour message vocal. */
  voiceDataUrl?: string;
  voiceDurationSec?: number;
};

export function messagePreviewText(message: ConversationMessage | undefined) {
  if (!message) return 'Aucun message';
  if (message.voiceDataUrl) return 'Message vocal';
  if (message.text.trim()) return message.text;
  return 'Aucun message';
}

export type Conversation = {
  id: string;
  ownerUserId: string;
  itemId: string;
  sellerName: string;
  productTitle: string;
  messages: ConversationMessage[];
};

export const CONVERSATIONS_STORAGE_KEY = 'bazariyatrou-conversations';

export function readConversations(ownerUserId?: string): Conversation[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const normalized = parsed.map((conv: any) => ({
      id: String(conv.id ?? `conv-${Date.now()}`),
      ownerUserId: String(conv.ownerUserId ?? conv.userId ?? ''),
      itemId: String(conv.itemId ?? conv.productSlug ?? ''),
      sellerName: conv.sellerName ?? 'Vendeur',
      productTitle: conv.productTitle ?? 'Annonce',
      messages: Array.isArray(conv.messages)
        ? conv.messages.map((msg: any) => ({
            id: String(msg.id ?? `msg-${Date.now()}`),
            sender: msg.sender === 'me' ? 'me' : 'other',
            text: typeof msg.text === 'string' ? msg.text : '',
            time: msg.time ?? '',
            voiceDataUrl:
              typeof msg.voiceDataUrl === 'string' ? msg.voiceDataUrl : undefined,
            voiceDurationSec:
              typeof msg.voiceDurationSec === 'number'
                ? msg.voiceDurationSec
                : undefined,
          }))
        : [],
    }));

    if (!ownerUserId) return normalized;
    return normalized.filter((conv) => conv.ownerUserId === ownerUserId);
  } catch {
    return [];
  }
}

export function writeConversations(conversations: Conversation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    CONVERSATIONS_STORAGE_KEY,
    JSON.stringify(conversations)
  );
}

export function getConversationById(id: string, ownerUserId: string) {
  return (
    readConversations(ownerUserId).find((conv) => conv.id === id) ?? null
  );
}

export function upsertConversation(conversation: Conversation) {
  const conversations = readConversations();
  const index = conversations.findIndex((conv) => conv.id === conversation.id);

  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  writeConversations(conversations);
}

export function appendMessageToConversation(
  conversationId: string,
  ownerUserId: string,
  message: ConversationMessage
) {
  const conversations = readConversations();
  const updated = conversations.map((conv) =>
    conv.id === conversationId && conv.ownerUserId === ownerUserId
      ? { ...conv, messages: [...conv.messages, message] }
      : conv
  );

  writeConversations(updated);
}