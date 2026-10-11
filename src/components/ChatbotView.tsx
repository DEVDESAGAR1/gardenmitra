import React, { useState, useRef, useEffect } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import { TaskAwareImageIntake } from './TaskAwareImageIntake';
import {
  Send,
  Sparkles,
  Bot,
  User,
  MapPin,
  Sun,
  Home,
  Copy,
  Check,
  Trash2,
  Paperclip,
  X,
  Loader2,
  Cpu
} from 'lucide-react';

export const ChatbotView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChatMessages,
    profile,
    selectedGardenPlants,
    selectedSpace,
    spaces,
    modelAvailability
  } = useGarden();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [showAttachmentDrawer, setShowAttachmentDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedPrompts = [
    'Help me identify my plant.',
    'Why are my leaves turning yellow?',
    'Create a care routine for my plants.',
    'What can I grow on my balcony?',
    'How often should I water my plant?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachmentUrl) || isSending) return;

    const currentAttachment = attachmentUrl;
    setInput('');
    setAttachmentUrl(null);
    setShowAttachmentDrawer(false);
    setIsSending(true);

    try {
      await sendChatMessage(text || 'What do you observe in this gardening photo?', currentAttachment || undefined);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleClearChat = () => {
    clearChatMessages();
    setShowClearConfirm(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}>
                Ask Mitra
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Your private, beginner-friendly gardening companion
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {chatMessages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="btn btn-secondary btn-sm"
                title="Clear conversation"
                aria-label="Clear conversation history"
              >
                <Trash2 size={14} />
                <span className="hide-on-compact">Clear Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Context Awareness & Privacy Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.825rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={14} color="var(--color-primary)" />
            Active Space:
          </span>
          <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
            <Home size={12} />
            {selectedSpace ? selectedSpace.name : (profile?.spaceType || 'Space')} ({selectedSpace ? selectedSpace.size : (profile?.spaceSize || 'size')})
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            <MapPin size={12} />
            {profile?.location.city || 'Location not set'}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            <Sun size={12} />
            {(selectedSpace?.sunlight || profile?.sunlight || 'Sunlight').replace(/_/g, ' ')}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            {selectedGardenPlants.length} Plants in this space
          </span>
          {spaces.length > 1 && <SpaceSelector compact={true} />}
        </div>

        {/* Local Provider Badge */}
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Cpu size={13} color={modelAvailability.status === 'available' ? '#10B981' : 'var(--color-text-subtle)'} />
          <span>
            {modelAvailability.status === 'available'
              ? 'Local Gemma/Ollama AI (Private on device)'
              : 'Deterministic Local Assistant (Offline ready)'}
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className="card"
        role="log"
        aria-live="polite"
        style={{
          padding: '1.25rem',
          minHeight: 400,
          maxHeight: 560,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem',
          marginBottom: '1rem',
          backgroundColor: '#FAFCFA'
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', padding: '2rem 1rem', maxWidth: 460 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <Bot size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
              Welcome to GardenMitra Assistant
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Ask anything about your space, watering tips, plant health, or container sizing. Messages stay strictly on your device.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isUser ? 'var(--color-terracotta)' : 'var(--color-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div style={{ maxWidth: '82%', position: 'relative' }}>
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-lg)',
                      borderTopRightRadius: isUser ? 2 : 'var(--radius-lg)',
                      borderTopLeftRadius: !isUser ? 2 : 'var(--radius-lg)',
                      backgroundColor: isUser ? 'var(--color-primary)' : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : 'var(--color-text-main)',
                      boxShadow: 'var(--shadow-sm)',
                      border: isUser ? 'none' : '1px solid var(--color-border-subtle)',
                      fontSize: '0.925rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {/* Optional Image Attachment */}
                    {msg.imageAttachment && (
                      <div
                        style={{
                          marginBottom: '0.65rem',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          maxHeight: 220
                        }}
                      >
                        <img
                          src={msg.imageAttachment}
                          alt="Attached gardening photo"
                          style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {msg.content}
                  </div>

                  {/* Actions & Timestamp row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isUser ? 'flex-end' : 'space-between',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      padding: '0 0.25rem'
                    }}
                  >
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.725rem', color: 'var(--color-text-subtle)' }}
                        title="Copy answer"
                        aria-label="Copy message text"
                      >
                        {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}

                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Follow-up question chips from assistant */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {msg.suggestedQuestions.map((sq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(sq)}
                          className="badge badge-neutral"
                          style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isSending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={16} />
            </div>
            <div
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <Loader2 size={16} className="spin" color="var(--color-primary)" />
              <span>Mitra is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Shelf */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
          Suggested questions:
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isSending}
              className="badge badge-green"
              style={{
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Image Attachment Drawer */}
      {showAttachmentDrawer && (
        <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
              Attach Plant or Garden Photo
            </span>
            <button
              type="button"
              onClick={() => setShowAttachmentDrawer(false)}
              className="btn btn-ghost btn-sm"
              aria-label="Close photo attachment drawer"
            >
              <X size={14} />
            </button>
          </div>

          <TaskAwareImageIntake
            workflow="chatbot"
            currentPhotoUrl={attachmentUrl}
            onPhotoSelected={(url) => setAttachmentUrl(url)}
            onPhotoRemoved={() => setAttachmentUrl(null)}
          />
        </div>
      )}

      {/* Attachment Preview Chip */}
      {attachmentUrl && !showAttachmentDrawer && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border-medium)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.5rem',
            fontSize: '0.8rem'
          }}
        >
          <img
            src={attachmentUrl}
            alt="Attachment preview"
            style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
          />
          <span style={{ color: 'var(--color-text-main)' }}>Photo attached</span>
          <button
            type="button"
            onClick={() => setAttachmentUrl(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: 2 }}
            aria-label="Remove attached photo"
          >
            <X size={14} color="#EF4444" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-medium)',
          padding: '0.4rem 0.6rem',
          boxShadow: 'var(--shadow-sm)',
          alignItems: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={() => setShowAttachmentDrawer((prev) => !prev)}
          className={`btn btn-ghost btn-sm ${showAttachmentDrawer ? 'active' : ''}`}
          style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', color: attachmentUrl ? 'var(--color-primary)' : 'inherit' }}
          title="Attach plant or garden photo"
          aria-label="Attach photo"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          id="chatbot-message-input"
          aria-label="Ask a garden question"
          rows={1}
          className="form-input"
          style={{
            border: 'none',
            boxShadow: 'none',
            padding: '0.6rem 0.8rem',
            resize: 'none',
            minHeight: 40,
            maxHeight: 120,
            overflowY: 'auto'
          }}
          placeholder="Ask anything about your space, watering, or pests (Shift+Enter for newline)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />

        <button
          type="submit"
          aria-label="Send message"
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)' }}
          disabled={(!input.trim() && !attachmentUrl) || isSending}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 400,
              width: '100%',
              padding: '1.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <h3 id="clear-dialog-title" style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', margin: '0 0 0.5rem' }}>
              Clear Chat History?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
              This will reset the conversation history for this session. Your garden plants and tasks will not be affected.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="btn btn-terracotta btn-sm"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
