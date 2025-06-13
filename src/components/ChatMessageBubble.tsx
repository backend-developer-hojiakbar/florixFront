
import React from 'react';
import { ChatMessage } from '../types';
import { SparklesIcon } from './icons';

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-sm md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow-md ${
          isUser ? 'chat-bubble-user ml-auto' : 'chat-bubble-ai mr-auto'
        }`}
      >
        <div className="flex items-start space-x-2.5">
            {!isUser && <SparklesIcon className="w-5 h-5 text-green-700 flex-shrink-0 mt-1" />}
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-gray-800' : 'text-green-950'}`}>
            {message.text}
            </p>
        </div>
        <p className={`text-xs mt-2 ${isUser ? 'text-gray-400 text-right' : 'text-green-700/80 text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessageBubble;