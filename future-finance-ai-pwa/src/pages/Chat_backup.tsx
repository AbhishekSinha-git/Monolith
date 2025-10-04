import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Mic, Download, ThumbsUp, ThumbsDown, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FiMcpAuth } from '@/components/FiMcpAuth';
import { realFiMcpApi, type FiMcpConnectionStatus, type AIQueryResponse } from '@/api/realFiMcp';
import {
  LineChart as RechartsLine,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type: 'text' | 'chart' | 'suggestion';
  data?: any;
  financialContext?: {
    netWorth: number;
    portfolioReturns: {
      cagr: number;
      xirr: number;
      ytd: number;
    };
    creditScore: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<FiMcpConnectionStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    checkFiMcpStatus();
    if (isAuthenticated) {
      loadSuggestions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFiMcpStatus = async () => {
    try {
      const response = await realFiMcpApi.getConnectionStatus();
      if (response.success && response.data) {
        setConnectionStatus(response.data);
        setIsAuthenticated(response.data.authenticated);
      }
    } catch (error) {
      console.error('Error checking Fi MCP status:', error);
    }
  };

  const loadSuggestions = () => {
    setSuggestions([
      "How much money will I have at 40?",
      "Can I afford a ₹50L home loan?", 
      "Which SIPs underperformed the market?",
      "How's my net worth growing?",
      "What are my biggest expenses?",
      "Should I invest more in equities?",
      "When can I retire comfortably?",
      "Show me my portfolio performance"
    ]);
  };

  const initAI = async () => {
    if (user?.id && isAuthenticated) {
        aiServiceRef.current = new AIService(user.id);
        try {
          await aiServiceRef.current.initialize();
          const sessions = await aiServiceRef.current.chatHistory.getSessions();
          setSessions(sessions);
          
          // Get current session or create one
          const currentSession = aiServiceRef.current.chatHistory.getCurrentSession();
          if (currentSession) {
            setCurrentSession(currentSession.id);
            const historicalMessages = await aiServiceRef.current.chatHistory.loadMessages(currentSession.id);
            setMessages(historicalMessages.map(msg => ({
              id: msg.id!,
              content: msg.content,
              isUser: msg.is_user,
              timestamp: new Date(msg.created_at!),
              type: msg.type,
              data: msg.data
            })));
          }

          // Subscribe to new messages
          const unsubscribe = aiServiceRef.current.chatHistory.onNewMessage(msg => {
            setMessages(prev => [...prev, {
              id: msg.id!,
              content: msg.content,
              isUser: msg.is_user,
              timestamp: new Date(msg.created_at!),
              type: msg.type,
              data: msg.data
            }]);
          });

          // Get initial chat suggestions
          const initialSuggestions = await aiServiceRef.current.getSuggestions();
          setSuggestions(initialSuggestions);

          return () => {
            unsubscribe();
          };
        } catch (error) {
          console.error('Error initializing AI service:', error);
        }
      }
    };

    initAI();
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSwitchSession = async (sessionId: string) => {
    if (!aiServiceRef.current) return;
    setCurrentSession(sessionId);
    
    await aiServiceRef.current.chatHistory.switchSession(sessionId);
    const messages = await aiServiceRef.current.chatHistory.loadMessages(sessionId);
    setMessages(messages.map(msg => ({
      id: msg.id!,
      content: msg.content,
      isUser: msg.is_user,
      timestamp: new Date(msg.created_at!),
      type: msg.type,
      data: msg.data
    })));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !aiServiceRef.current) return;

    setInputValue('');
    setIsTyping(true);

    try {
      const response = await aiServiceRef.current.processQuery(inputValue);
      const newSuggestions = await aiServiceRef.current.getSuggestions();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error processing query:', error);
      // The error message will be handled by the ChatHistoryService subscription
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-1 flex flex-col bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          {/* Chat Session Selection */}
          {sessions.length > 1 && (
            <div className="mb-4">
              <select
                className="w-full p-2 border rounded"
                value={currentSession || ''}
                onChange={(e) => handleSwitchSession(e.target.value)}
              >
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({new Date(session.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <Avatar className="h-8 w-8 bg-primary">
                    <AvatarFallback className="text-primary-foreground font-bold text-sm">
                      M
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${message.isUser ? 'order-first' : ''}`}>
                  <Card className={message.isUser ? 'bg-primary text-primary-foreground' : ''}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                      
                      {!message.isUser && message.type === 'chart' && message.data && (
                        <div className="mt-4 h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {message.data.type === 'pie' ? (
                              <PieChart>
                                <Pie
                                  data={message.data.data}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                                >
                                  {message.data.data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            ) : (
                              <RechartsLine data={message.data.data}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" />
                              </RechartsLine>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}

                      <p className={`text-xs mt-2 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {!message.isUser && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {message.isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="text-primary-foreground font-bold text-sm">
                    M
                  </AvatarFallback>
                </Avatar>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(suggestion);
                  handleSendMessage();
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your finances..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;