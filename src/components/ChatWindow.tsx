
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatMessageBubble from './ChatMessageBubble';
import { SendIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

interface ChatWindowProps {
  messages: ChatMessage[];
  userInput: string;
  onUserInput: (input: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  userInput,
  onUserInput,
  onSendMessage,
  isLoading,
  isDisabled,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading && userInput.trim() && !isDisabled) {
      onSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white shadow-xl rounded-2xl border border-gray-100 card-shadow">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        <SparklesIcon className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-green-700">AI Yordamchi bilan Suhbat</h3>
      </div>
      <div className="flex-grow p-4 space-y-4 overflow-y-auto chat-scrollable" style={{maxHeight: '450px'}}>
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
          <div className="flex justify-start mb-3">
             <div className="chat-bubble-ai mr-auto max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg shadow">
                <Spinner size="sm" message="AI javob yozmoqda..." />
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isDisabled ? "Oldin rasmni tahlil qiling" : "Xabaringizni yozing..."}
            className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
            disabled={isLoading || isDisabled}
            aria-label="Xabar kiritish maydoni"
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading || !userInput.trim() || isDisabled}
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Yuborish"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;