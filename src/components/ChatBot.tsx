import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Bot,
  User,
  RefreshCw,
  X
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
  metadata?: {
    audioUrl?: string;
    imageUrl?: string;
    suggestions?: string[];
    thinking?: string;
  };
}

interface ConversationData {
  messages: Message[];
  timestamp: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      loadConversation();
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [user]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';
      setRecognition(recog);
    }
  }, []);

  const loadConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const conversationData = data.conversation_data as unknown as ConversationData;
        if (conversationData && conversationData.messages) {
          setMessages(conversationData.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          setConversationId(data.id);
        }
      } else {
        await initializeConversation();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const initializeConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: user.id,
          conversation_data: { messages: [], timestamp: new Date().toISOString() } as any
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const saveConversation = async (updatedMessages: Message[]) => {
    if (!conversationId || !user) return;

    try {
      const conversationData: ConversationData = {
        messages: updatedMessages,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('chatbot_conversations')
        .update({
          conversation_data: conversationData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const searchKnowledgeBase = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .ilike('question', `%${query}%`)
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  };

  const createSupportTicket = async (subject: string, message: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          message,
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return null;
    }
  };

  const generateBotResponse = async (userMessage: string, messageType: 'text' | 'audio' | 'image' = 'text') => {
    setIsLoading(true);
    
    let response = "";
    let suggestions: string[] = [];

    // Check if user needs support
    if (userMessage.toLowerCase().includes('help') || 
        userMessage.toLowerCase().includes('support') || 
        userMessage.toLowerCase().includes('contact')) {
      
      // Create support ticket
      const ticket = await createSupportTicket(
        'Chatbot Support Request', 
        `User message: ${userMessage}`
      );
      
      if (ticket) {
        response = "I've created a support ticket for you. Our support team will get back to you soon. In the meantime, let me see if I can help you with general recipe questions.";
        suggestions = ["Browse recipes", "Cooking tips", "Ingredient help", "Check ticket status"];
      }
    } else {
      // Search knowledge base first
      const knowledgeResults = await searchKnowledgeBase(userMessage);
      
      if (knowledgeResults.length > 0) {
        response = knowledgeResults[0].answer;
        suggestions = knowledgeResults.slice(1).map(item => item.question);
      } else {
        // Generate contextual response
        if (userMessage.toLowerCase().includes('recipe')) {
          response = "I'd be happy to help you with recipes! What type of cuisine or dish are you interested in? I can suggest recipes based on your dietary preferences, cooking skill level, and available ingredients.";
          suggestions = ["Show me easy recipes", "Kenyan cuisine recipes", "Vegetarian options", "Quick 30-minute meals"];
        } else if (userMessage.toLowerCase().includes('ingredient')) {
          response = "Great! I can help you with ingredient information, substitutions, and where to find them in Kenyan supermarkets. What specific ingredient are you curious about?";
          suggestions = ["Common substitutes", "Local supermarket prices", "Nutritional information", "Storage tips"];
        } else if (userMessage.toLowerCase().includes('cooking')) {
          response = "I love talking about cooking techniques! Whether you're a beginner or experienced cook, I can guide you through various methods and tips to improve your culinary skills.";
          suggestions = ["Basic cooking techniques", "Kitchen safety tips", "Time-saving hacks", "Equipment recommendations"];
        } else {
          response = "I'm here to help with all things related to cooking, recipes, and food! Feel free to ask me about recipes, ingredients, cooking techniques, meal planning, or anything food-related. If I can't answer your question, I'll connect you with our support team.";
          suggestions = ["Browse recipes", "Meal planning help", "Cooking tips", "Contact support"];
        }
      }
    }

    const botMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: { suggestions }
    };

    const updatedMessages = [...messages, botMessage];
    setMessages(updatedMessages);
    await saveConversation(updatedMessages);
    
    setIsLoading(false);
  };

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    saveConversation(updatedMessages);
    generateBotResponse(messageToSend);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage(suggestion);
  };

  const handleVoiceStart = () => {
    if (!recognition) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Please use text input instead.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRecording(true);
      recognition.start();
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
        handleSendMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Voice input error",
          description: "There was an error with voice recognition. Please try again.",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsRecording(false);
      toast({
        title: "Voice input error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVoiceEnd = () => {
    if (!recognition || !isRecording) return;
    
    try {
      recognition.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsRecording(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ title: "Image upload feature coming soon!" });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-14 w-14 md:h-12 md:w-12 rounded-full bg-orange-600 hover:bg-orange-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-7 w-7 md:h-6 md:w-6 text-white" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[95vw] flex flex-col h-[90vh] max-h-[90vh] min-h-[400px] p-0 md:resize-y">
          <DialogHeader className="p-4 border-b bg-orange-600 text-white">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Recipe Assistant
              <Badge variant="secondary" className="ml-auto bg-orange-200 text-orange-800 text-xs">
                AI Powered
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 h-0 min-h-0 p-3 md:p-4 overflow-y-auto overflow-x-hidden">
              <div className="space-y-3 md:space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-6 md:py-8">
                    <Bot className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-3 md:mb-4" />
                    <h3 className="font-semibold text-gray-600 mb-2 text-sm md:text-base">Welcome to Recipe Assistant!</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 px-2">
                      I can help you with recipes, cooking tips, ingredients, and more!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
                      {['Find recipes', 'Cooking tips', 'Ingredients info', 'Meal planning'].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs h-8 md:h-9"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[80%] w-fit p-2 md:p-3 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-start gap-2 mb-1">
                        {message.sender === 'bot' ? <Bot className="h-3 w-3 md:h-4 md:w-4 mt-1" /> : <User className="h-3 w-3 md:h-4 md:w-4 mt-1" />}
                        <div className="flex-1">
                          <p className="text-xs md:text-sm break-words break-all whitespace-pre-line leading-relaxed">{message.content}</p>
                          {message.metadata?.suggestions && (
                            <div className="mt-2 space-y-1">
                              {message.metadata.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs h-auto p-1 text-orange-600 hover:bg-orange-50"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 md:p-4 border-t">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about recipes, cooking tips..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onMouseDown={handleVoiceStart}
                  onMouseUp={handleVoiceEnd}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleVoiceStart();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleVoiceEnd();
                  }}
                  disabled={isRecording || isLoading || !recognition}
                  className="mr-1 h-9 w-9 md:h-10 md:w-10"
                  title={!recognition ? 'Voice input not supported in this browser' : isRecording ? 'Listening...' : 'Hold to speak'}
                >
                  {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBot;
