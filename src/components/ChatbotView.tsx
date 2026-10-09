import React, { useState, useRef, useEffect } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Info,
  MapPin,
  Sun,
  Home
} from 'lucide-react';

export const ChatbotView: React.FC = () => {
  const { chatMessages, sendChatMessage, profile, selectedGardenPlants, selectedSpace, spaces } = useGarden();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What should I grow?',
    'What should I do today?',
    'What do I need to buy?',
    'How often should I water this?',
    'What fertilizer do I need?',
    'My plant doesn\'t look healthy.',
    'Why are my leaves turning yellow?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    await sendChatMessage(text);
    setIsSending(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <MessageSquare size={26} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
            Ask GardenMitra
          </h1>
        </div>
        <p style={{ margin: 0 }}>
          Your garden companion. Ask anything about your plants, soil, or routine.
        </p>
      </div>

      {/* Live Context Awareness Banner */}
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

        {/* Local Rule-based indicator */}
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          title="Modular architecture ready for Gemma or Ollama"
        >
          <Info size={13} />
          Local Rule-Based Assistant (No Cloud LLM)
        </span>
      </div>

      {/* Chat Messages Container */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          minHeight: 380,
          maxHeight: 520,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#FAFCFA'
        }}
      >
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
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
                  width: 32,
                  height: 32,
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
              <div style={{ maxWidth: '80%' }}>
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
                  {msg.content}
                </div>

                {/* Timestamp */}
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-subtle)',
                    marginTop: '0.25rem',
                    textAlign: isUser ? 'right' : 'left',
                    padding: '0 0.25rem'
                  }}
                >
                  {msg.timestamp}
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
        })}
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
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          type="text"
          className="form-input"
          style={{ border: 'none', boxShadow: 'none', padding: '0.6rem 0.8rem' }}
          placeholder="Ask anything about your space, watering, or pests..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)' }}
          disabled={!input.trim() || isSending}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
