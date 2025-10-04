import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, Download, ThumbsUp, ThumbsDown, Shield, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiMcp } from '@/contexts/FiMcpContext';
import { FiMcpAuth } from '@/components/FiMcpAuth';
import { realFiMcpApi, type AIQueryResponse } from '@/api/realFiMcp';
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
  const { isAuthenticated, financialData, setAuthenticated } = useFiMcp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Check authentication status on mount - handled by context now
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSuggestions();
      addWelcomeMessage();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFiMcpStatus = async () => {
    // Now handled by FiMcpContext
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

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      content: `🎉 Welcome to your AI-powered financial assistant! 

I'm now connected to your real financial data through Fi Money's MCP Server. This means I can provide deeply personalized insights about your actual portfolio, assets, liabilities, and more.

Try asking me:
• "How much money will I have at 40?"
• "Can I afford a ₹50L home loan?"
• "Which investments are underperforming?"
• "How's my net worth growing?"

What would you like to know about your finances?`,
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    checkFiMcpStatus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await realFiMcpApi.processAIQuery(inputValue);
      
      if (response.success && response.data) {
        const aiResponse: AIQueryResponse = response.data;
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: aiResponse.response,
          isUser: false,
          timestamp: new Date(),
          type: 'text',
          financialContext: aiResponse.financialContext
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: "Sorry, I encountered an error processing your request. Please try again.",
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm having trouble connecting to your financial data. Please check your Fi MCP connection and try again.",
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const renderMessage = (message: Message) => {
    const isUser = message.isUser;

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[80%]`}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className={isUser ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}>
              {isUser ? user?.email?.[0]?.toUpperCase() || 'U' : 'AI'}
            </AvatarFallback>
          </Avatar>
          
          <div className={`space-y-2 ${isUser ? 'mr-2' : 'ml-2'}`}>
            <Card className={`${isUser ? 'bg-blue-500 text-white' : 'bg-white'}`}>
              <CardContent className="p-3">
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Show financial context for AI messages */}
                {!isUser && message.financialContext && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Net Worth: {formatCurrency(message.financialContext.netWorth)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>CAGR: {message.financialContext.portfolioReturns.cagr.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Credit: {message.financialContext.creditScore}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className={`text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show Fi MCP authentication if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <FiMcpAuth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Financial AI Assistant</h1>
              <div className="flex items-center space-x-2">
                <Badge variant={isAuthenticated ? 'default' : 'secondary'} className="text-xs">
                  {isAuthenticated ? '✅ Authenticated with Fi MCP' : '⚠️ Not Authenticated'}
                </Badge>
                {financialData && (
                  <Badge variant="default" className="text-xs">
                    📊 Live Data Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation about your finances</p>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-green-500 text-white">AI</AvatarFallback>
              </Avatar>
              <Card className="bg-white">
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="text-sm text-gray-600 mb-2">Try asking:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your finances..."
              className="pr-12"
              disabled={isTyping}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;