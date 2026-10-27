import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Loader2, MessageCircle, ChevronDown } from 'lucide-react';
import { aiCopilotService, ChatMessage, TripContext, type ItineraryChange } from '../services/aiCopilotService';
import { useAuth } from '../contexts/AuthContext';
import { ItineraryDiffPreview } from './ItineraryDiffPreview';

interface TravelCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  tripContext?: TripContext;
  onApplyChanges?: (changes: ItineraryChange[]) => void;
}

export const TravelCopilot: React.FC<TravelCopilotProps> = ({
  isOpen,
  onClose,
  tripContext,
  onApplyChanges,
}) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ItineraryChange[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: tripContext
          ? `Hi! I'm your AI Travel Copilot. I see you're planning a ${tripContext.days}-day trip to ${tripContext.destination}. How can I help you enhance your journey?`
          : "Hi! I'm your AI Travel Copilot. I'm here to help you plan amazing trips, suggest activities, and answer your travel questions. How can I assist you today?",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, tripContext]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiCopilotService.sendMessage(
        userMessage.content,
        tripContext,
        messages,
        session?.access_token
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        toolCalls: result.toolCalls,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // If there are tool calls, show the diff preview
      if (result.toolCalls && result.toolCalls.length > 0) {
        setPendingChanges(result.toolCalls);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get response. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Copilot error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (pendingChanges && onApplyChanges) {
      onApplyChanges(pendingChanges);
      setPendingChanges(null);
      
      // Add confirmation message
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Changes applied successfully! Your itinerary has been updated.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges(null);
    
    // Add discard message
    const discardMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Changes discarded. Your itinerary remains unchanged.',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, discardMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const quickSuggestions = aiCopilotService.getQuickSuggestions(tripContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Travel Copilot</h3>
            <p className="text-xs text-blue-100">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close AI Copilot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trip Context Banner */}
      {tripContext && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Context: {tripContext.destination} • {tripContext.days} days • ₹
              {tripContext.budget?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">AI Copilot</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Diff Preview for Proposed Changes */}
        {pendingChanges && pendingChanges.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[95%]">
              <ItineraryDiffPreview
                changes={pendingChanges}
                onApply={handleApplyChanges}
                onDiscard={handleDiscardChanges}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.slice(0, 3).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSuggestion(suggestion)}
                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your trip..."
              disabled={isLoading}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{
                minHeight: '42px',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI responses are suggestions. Verify details before booking.
        </p>
      </div>
    </div>
  );
};

// Floating button component
interface CopilotButtonProps {
  onClick: () => void;
  hasContext: boolean;
}

export const CopilotButton: React.FC<CopilotButtonProps> = ({ onClick, hasContext }) => {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (hasContext) {
      const timer = setTimeout(() => setPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasContext]);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${
        pulse && hasContext ? 'animate-pulse' : ''
      }`}
      aria-label="Open AI Travel Copilot"
    >
      <div className="relative">
        <Bot className="w-6 h-6" />
        {hasContext && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
        )}
      </div>
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        AI Travel Copilot
        {hasContext && ' • Trip context available'}
      </div>
    </button>
  );
};
