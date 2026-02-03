import { useState, useEffect, useCallback } from 'preact/hooks';
import { FloatingButton } from './FloatingButton';
import { WelcomeTeaser } from './WelcomeTeaser';
import { ChatWindow } from './ChatWindow';
import { useChat } from '@/hooks/useChat';
import { getOrCreateSessionId, getSavedEmail, saveEmail } from '@/services/session';
import type { WidgetConfig } from '@/types';

interface AppProps {
  config: WidgetConfig;
}

export function App({ config }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const sessionId = getOrCreateSessionId();
  const [userEmail] = useState<string | null>(() => getSavedEmail());

  const chat = useChat({ config, sessionId, userEmail });

  // Show teaser after delay (only once)
  useEffect(() => {
    if (teaserDismissed || isOpen) return;

    const timer = setTimeout(() => {
      setShowTeaser(true);
    }, config.teaserDelay);

    return () => clearTimeout(timer);
  }, [config.teaserDelay, teaserDismissed, isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setShowTeaser(false);
    setHasOpened(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTeaserDismiss = useCallback(() => {
    setShowTeaser(false);
    setTeaserDismissed(true);
  }, []);

  const handleEmailSubmit = useCallback(
    async (questionId: string, email: string) => {
      await chat.submitEmail(questionId, email);
      saveEmail(email);
    },
    [chat.submitEmail],
  );

  return (
    <>
      <FloatingButton onClick={handleOpen} isOpen={isOpen} />

      {showTeaser && !isOpen && (
        <WelcomeTeaser onOpen={handleOpen} onDismiss={handleTeaserDismiss} />
      )}

      {/* Lazy render: only mount ChatWindow after first open */}
      {hasOpened && isOpen && (
        <ChatWindow
          messages={chat.messages}
          isLoading={chat.isLoading}
          error={chat.error}
          isRateLimited={chat.isRateLimited}
          onSendMessage={chat.sendMessage}
          onRate={chat.submitRating}
          onEmailSubmit={handleEmailSubmit}
          onClearError={chat.clearError}
          onClose={handleClose}
        />
      )}
    </>
  );
}
