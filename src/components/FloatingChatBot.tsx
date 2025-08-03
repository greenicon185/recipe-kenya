import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, Bot, User, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Recipe Assistant. I can help you with recipes, cooking tips, and ingredient substitutions. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Voice recognition setup
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';
      
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        setInputMessage(transcript);
        setIsRecording(false);
        handleSendMessage(transcript);
      };
      
      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recog.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recog.onstart = () => {
        console.log('Speech recognition started');
      };
      
      setRecognition(recog);
    }
  }, []);

  const handleVoiceStart = () => {
    if (!recognition) return;
    
    try {
      setIsRecording(true);
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsRecording(false);
    }
  };

  const handleVoiceEnd = () => {
    if (!recognition) return;
    recognition.stop();
    setIsRecording(false);
  };

  const searchKnowledgeBase = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  };

  const handleSendMessage = async (transcript: string) => {
    if (!transcript.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: transcript,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Search knowledge base for relevant answers
      const knowledgeResults = await searchKnowledgeBase(transcript.toLowerCase());
      
      let response = '';
      
      if (knowledgeResults.length > 0) {
        const bestMatch = knowledgeResults[0];
        response = bestMatch.answer;
        
        if (knowledgeResults.length > 1) {
          response += '\n\nRelated topics:\n';
          knowledgeResults.slice(1).forEach((result, index) => {
            response += `${index + 1}. ${result.question}\n`;
          });
        }
      } else {
        // Default responses for common queries
        const lowerQuery = transcript.toLowerCase();
        
        if (lowerQuery.includes('help') || lowerQuery.includes('support')) {
          response = 'I\'d be happy to help! You can ask me about:\n\n• Recipe searches and filtering\n• Cooking tips and techniques\n• Ingredient substitutions\n• Meal planning\n• Account and profile questions\n\nIf you need additional support, you can contact our support team by saying "contact support".';
        } else if (lowerQuery.includes('contact support')) {
          response = 'I\'ll help you contact our support team. You can create a support ticket through the admin panel, or continue chatting with me for immediate assistance with recipes and cooking questions.';
        } else if (lowerQuery.includes('recipe') || lowerQuery.includes('cook')) {
          response = 'I can help you with recipes! You can:\n\n• Search for recipes by name or ingredient\n• Filter by cuisine, difficulty, or cooking time\n• Get cooking tips and substitution suggestions\n• Save recipes to your favorites\n\nWhat specific recipe or cooking question do you have?';
        } else {
          response = 'I\'m here to help with recipes and cooking! You can ask me about finding recipes, cooking techniques, ingredient substitutions, or meal planning. What would you like to know?';
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 shadow-lg z-50"
          size="icon"
        >
          <MessageSquare size={24} />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot size={20} />
              Recipe Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-orange-700 h-8 w-8"
            >
              <X size={16} />
            </Button>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 p-0 h-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 h-0 min-h-0 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-orange-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-orange-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-orange-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about recipes..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onMouseDown={handleVoiceStart}
                  onMouseUp={handleVoiceEnd}
                  onTouchStart={handleVoiceStart}
                  onTouchEnd={handleVoiceEnd}
                  disabled={isRecording || isLoading || !recognition}
                  className="mr-1"
                  title={!recognition ? 'Voice input not supported in this browser' : isRecording ? 'Listening...' : 'Hold to speak'}
                >
                  {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default FloatingChatBot;
