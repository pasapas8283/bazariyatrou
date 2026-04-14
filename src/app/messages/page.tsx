'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import {
  messagePreviewText,
  readConversations,
  type Conversation,
} from '../../lib/messages-storage';
import { useAuth } from '../../hooks/use-auth';

export default function MessagesPage() {
  const router = useRouter();
  const { currentUser, hydrated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = () => {
    if (!currentUser) return;
    setConversations(readConversations(currentUser.id));
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) return;

    loadConversations();

    const onFocus = () => loadConversations();
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [hydrated, currentUser]);

  if (hydrated && !currentUser) {
    router.replace('/connexion');
    return null;
  }

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Messages</h1>
            <p className="mt-2 text-sm text-gray-500">
              Retrouvez ici vos conversations avec les vendeurs.
            </p>
          </div>

          <div className="px-4 pb-5">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Aucun message pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => {
                  const lastMessage =
                    conversation.messages[conversation.messages.length - 1];

                  return (
                    <Link
                      key={conversation.id}
                      href={`/messages/conversation?id=${encodeURIComponent(
                        conversation.id
                      )}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold text-gray-900">
                            {conversation.sellerName}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            {conversation.productTitle}
                          </p>
                        </div>

                        {lastMessage?.time && (
                          <span className="text-xs text-gray-400">
                            {lastMessage.time}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-gray-700">
                        {messagePreviewText(lastMessage)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}