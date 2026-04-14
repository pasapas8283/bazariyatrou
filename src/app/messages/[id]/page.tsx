'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import {
  appendMessageToConversation,
  getConversationById,
  type Conversation,
} from '../../../lib/messages-storage';
import { useAuth } from '../../../hooks/use-auth';
import { loadMergedMarketplaceItems } from '../../../lib/listings-merge';

const DEFAULT_FIRST_MESSAGE_DRAFT =
  "Bonjour , est ce que l'article est toujours disponible ?";

const MAX_RECORD_SEC = 90;
/** ~2 Mo — limite pratique pour le stockage local (localStorage). */
const MAX_VOICE_BYTES = 2_000_000;

function draftStorageKey(convId: string) {
  return `bazariyatrou-msgDraft:${convId}`;
}

function pickRecorderMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return '';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function ConversationDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromParams = params?.id;
  const id = useMemo(() => {
    if (Array.isArray(idFromParams)) return idFromParams[0] ?? '';
    if (typeof idFromParams === 'string' && idFromParams.trim()) return idFromParams;
    return searchParams.get('id')?.trim() ?? '';
  }, [idFromParams, searchParams]);
  const { currentUser, hydrated } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [pendingVoice, setPendingVoice] = useState<{
    dataUrl: string;
    durationSec: number;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartedAtRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearRecordTimer = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  const loadConversation = () => {
    if (!currentUser) return;
    setConversation(getConversationById(id, currentUser.id));
  };

  useEffect(() => {
    if (!currentUser) return;
    loadConversation();
  }, [id, currentUser]);

  useEffect(() => {
    setText('');
    setPendingVoice(null);
    setVoiceError(null);
  }, [id]);

  useEffect(() => {
    return () => {
      clearRecordTimer();
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      stopStream();
    };
  }, [clearRecordTimer, stopStream]);

  const messageCount = useMemo(() => {
    if (!conversation || conversation.id !== id) return -1;
    return conversation.messages.length;
  }, [conversation, id]);

  useEffect(() => {
    if (messageCount > 0) {
      try {
        sessionStorage.removeItem(draftStorageKey(id));
      } catch {
        /* ignore */
      }
      setText('');
      return;
    }

    if (messageCount !== 0) return;

    try {
      const saved = sessionStorage.getItem(draftStorageKey(id));
      if (saved !== null) {
        setText(saved);
      } else {
        setText(DEFAULT_FIRST_MESSAGE_DRAFT);
        sessionStorage.setItem(draftStorageKey(id), DEFAULT_FIRST_MESSAGE_DRAFT);
      }
    } catch {
      setText(DEFAULT_FIRST_MESSAGE_DRAFT);
    }
  }, [id, messageCount]);

  const messages = useMemo(() => {
    return conversation?.messages ?? [];
  }, [conversation]);

  const openRelatedListing = async () => {
    if (!conversation) return;

    const listingId = conversation.itemId?.trim();
    const fallbackQuery = conversation.productTitle?.trim() ?? '';

    if (!listingId) {
      router.push(fallbackQuery ? `/?q=${encodeURIComponent(fallbackQuery)}` : '/');
      return;
    }

    try {
      const listings = await loadMergedMarketplaceItems();
      const found = listings.find((item) => item.id === listingId);

      if (found && found.status === 'available') {
        router.push(`/annonces/detail?id=${encodeURIComponent(listingId)}`);
        return;
      }
    } catch {
      // fallback ci-dessous
    }

    router.push(fallbackQuery ? `/?q=${encodeURIComponent(fallbackQuery)}` : '/');
  };

  const stopRecording = useCallback(
    (submit: boolean) => {
      setVoiceError(null);
      clearRecordTimer();
      const mr = mediaRecorderRef.current;
      mediaRecorderRef.current = null;

      if (!mr || mr.state === 'inactive') {
        setIsRecording(false);
        stopStream();
        return;
      }

      if (submit) {
        mr.onstop = async () => {
          stopStream();
          setIsRecording(false);
          const mime = mr.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          const elapsed = Math.max(
            1,
            Math.round((Date.now() - recordStartedAtRef.current) / 1000)
          );
          if (blob.size > MAX_VOICE_BYTES) {
            setVoiceError(
              'Enregistrement trop volumineux. Réessayez en parlant moins longtemps.'
            );
            return;
          }
          try {
            const dataUrl = await blobToDataUrl(blob);
            setPendingVoice({ dataUrl, durationSec: Math.min(elapsed, MAX_RECORD_SEC) });
          } catch {
            setVoiceError('Impossible de traiter l’audio. Réessayez.');
          }
        };
        mr.stop();
      } else {
        mr.onstop = () => {
          stopStream();
          setIsRecording(false);
          chunksRef.current = [];
        };
        mr.stop();
      }
    },
    [clearRecordTimer, stopStream]
  );

  const startRecording = async () => {
    if (!conversation || !currentUser) return;
    setVoiceError(null);
    setPendingVoice(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Enregistrement audio indisponible sur cet appareil.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const mr = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recordStartedAtRef.current = Date.now();
      setRecordSec(0);
      clearRecordTimer();
      recordTimerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - recordStartedAtRef.current) / 1000);
        setRecordSec(s);
        if (s >= MAX_RECORD_SEC) {
          stopRecording(true);
        }
      }, 250);

      mr.onerror = () => {
        setVoiceError('Erreur pendant l’enregistrement.');
        stopRecording(false);
      };

      mr.start(200);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      setVoiceError(
        'Micro refusé ou indisponible. Autorisez le micro dans les paramètres.'
      );
    }
  };

  const handleSendVoice = () => {
    if (!pendingVoice || !conversation || !currentUser) return;

    appendMessageToConversation(conversation.id, currentUser.id, {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: '',
      voiceDataUrl: pendingVoice.dataUrl,
      voiceDurationSec: pendingVoice.durationSec,
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    setPendingVoice(null);
    loadConversation();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;
    if (!conversation) return;
    if (!currentUser) return;

    appendMessageToConversation(conversation.id, currentUser.id, {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: text.trim(),
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    try {
      sessionStorage.removeItem(draftStorageKey(conversation.id));
    } catch {
      /* ignore */
    }
    setText('');
    loadConversation();
  };

  if (hydrated && !currentUser) {
    router.replace('/connexion');
    return null;
  }

  if (!conversation) {
    return (
      <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
        <MobileShell>
          <div className="min-h-full bg-white p-5">
            <p className="text-base font-medium text-gray-600">
              Conversation introuvable.
            </p>
          </div>
        </MobileShell>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="flex min-h-full flex-col bg-white">
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/messages" className="text-2xl font-bold text-gray-900">
                ‹
              </Link>

              <div>
                <h1 className="text-lg font-extrabold text-gray-900">
                  {conversation.sellerName}
                </h1>
                <button
                  type="button"
                  onClick={() => void openRelatedListing()}
                  className="text-left text-sm text-gray-500 underline underline-offset-2 hover:text-green-700"
                >
                  {conversation.productTitle}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun message.</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.sender === 'me'
                      ? 'ml-auto bg-green-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.voiceDataUrl ? (
                    <div className="space-y-1">
                      <p
                        className={`text-xs font-semibold ${
                          message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        Message vocal
                        {message.voiceDurationSec != null
                          ? ` · ${message.voiceDurationSec}s`
                          : ''}
                      </p>
                      <audio
                        controls
                        src={message.voiceDataUrl}
                        className="h-9 w-full max-w-[min(100%,260px)]"
                      />
                    </div>
                  ) : (
                    <p>{message.text}</p>
                  )}
                  <p
                    className={`mt-1 text-[11px] ${
                      message.sender === 'me'
                        ? 'text-green-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              ))
            )}
          </div>

          {pendingVoice && (
            <div className="border-t border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-900">Écouter avant envoi</p>
              <audio controls src={pendingVoice.dataUrl} className="mt-2 h-9 w-full" />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSendVoice}
                  className="flex-1 rounded-xl bg-green-700 py-2 text-sm font-bold text-white"
                >
                  Envoyer le vocal
                </button>
                <button
                  type="button"
                  onClick={() => setPendingVoice(null)}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="border-t border-gray-100 px-4 py-4"
          >
            {voiceError && (
              <p className="mb-2 text-xs text-red-600" role="alert">
                {voiceError}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                disabled={isRecording || !!pendingVoice}
                onChange={(e) => {
                  const v = e.target.value;
                  setText(v);
                  if (conversation.messages.length === 0) {
                    try {
                      sessionStorage.setItem(draftStorageKey(conversation.id), v);
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                placeholder="Écrire un message..."
                className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700 disabled:bg-gray-50"
              />

              {!isRecording ? (
                <button
                  type="button"
                  disabled={!!pendingVoice}
                  onClick={() => void startRecording()}
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-lg disabled:opacity-40"
                  aria-label="Enregistrer un message vocal"
                  title="Message vocal"
                >
                  🎤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  className="inline-flex shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                  aria-label="Arrêter et préparer l’envoi"
                >
                  <span className="text-base leading-none">■</span>
                  <span className="mt-0.5 tabular-nums">
                    {Math.floor(recordSec / 60)}:
                    {String(recordSec % 60).padStart(2, '0')}
                  </span>
                </button>
              )}

              <button
                type="submit"
                disabled={isRecording || !!pendingVoice}
                className="rounded-2xl bg-green-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
            {isRecording && (
              <p className="mt-2 text-center text-xs text-red-600">
                Enregistrement… max {MAX_RECORD_SEC}s
              </p>
            )}
          </form>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}

export default function ConversationDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <ConversationDetailPageContent />
    </Suspense>
  );
}
