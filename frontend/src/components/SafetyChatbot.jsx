import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PropTypes from "prop-types";

const SafetyChatbot = ({ onSOSRequest, userLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hi! I'm your SafeNow safety assistant. I can help answer questions about safety precautions, first aid, and emergency situations. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sosContext, setSOSContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const detectEmergencyType = (message) => {
    const lowerMessage = message.toLowerCase();

    // Keywords for different emergency types
    const keywords = {
      ambulance: [
        "accident",
        "injured",
        "bleeding",
        "unconscious",
        "heart attack",
        "stroke",
        "breathing",
        "medical",
        "hospital",
        "ambulance",
        "hurt",
        "pain",
        "broken",
        "fell",
      ],
      fire: [
        "fire",
        "smoke",
        "burning",
        "flames",
        "explosion",
        "gas leak",
        "electrical fire",
      ],
      ngo: [
        "help",
        "shelter",
        "support",
        "homeless",
        "food",
        "clothing",
        "counseling",
        "assistance",
        "rescue",
      ],
    };

    // Check for matches
    for (const [type, typeKeywords] of Object.entries(keywords)) {
      if (typeKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        return type;
      }
    }

    return null;
  };

  const shouldSuggestSOS = (userMessage, aiResponse) => {
    const combinedText = (userMessage + " " + aiResponse).toLowerCase();

    // Strong emergency indicators that should NOT trigger SOS
    // (because these are major emergencies where user wouldn't chat)
    const majorEmergencyKeywords = [
      "dying",
      "death",
      "critical",
      "severe bleeding",
      "can't breathe",
      "heart attack now",
      "unconscious",
    ];

    // Check if it's a major emergency (return false, don't suggest chatbot)
    const isMajorEmergency = majorEmergencyKeywords.some((keyword) =>
      combinedText.includes(keyword),
    );
    if (isMajorEmergency) {
      return false;
    }

    // Minor/moderate situations that warrant SOS suggestion
    const minorEmergencyKeywords = [
      "cut",
      "minor burn",
      "sprain",
      "twisted",
      "small injury",
      "need medical",
      "should i call",
      "need help",
      "what to do",
      "first aid",
      "advice",
      "guidance",
    ];

    // SOS-related keywords in AI response
    const sosSuggestions = [
      "seek medical",
      "call for help",
      "contact emergency",
      "get assistance",
      "medical attention",
      "send sos",
      "alert",
      "emergency services",
    ];

    const hasMinorIssue = minorEmergencyKeywords.some((keyword) =>
      combinedText.includes(keyword),
    );
    const aiSuggestsHelp = sosSuggestions.some((keyword) =>
      combinedText.includes(keyword),
    );

    return hasMinorIssue || aiSuggestsHelp;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    const userMsgId = Date.now();

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: "user",
        text: userMessage,
        timestamp: new Date(),
      },
    ]);

    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the chatbot API
      const response = await fetch("/api/sos/chatbot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const data = await response.json();
      const aiResponse = data.response;

      // Add AI response to chat
      const botMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          type: "bot",
          text: aiResponse,
          timestamp: new Date(),
        },
      ]);

      // Check if SOS should be suggested
      if (shouldSuggestSOS(userMessage, aiResponse)) {
        const emergencyType = detectEmergencyType(
          userMessage + " " + aiResponse,
        );

        setSOSContext({
          type: emergencyType || "ambulance",
          userMessage: userMessage,
          aiResponse: aiResponse,
        });

        // Add SOS suggestion message
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              type: "sos-suggestion",
              emergencyType: emergencyType || "ambulance",
              timestamp: new Date(),
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or if this is an emergency, use the SOS button directly.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSOSClick = (emergencyType) => {
    if (!userLocation) {
      alert(
        "Unable to get your location. Please enable location access to send SOS.",
      );
      return;
    }

    // Trigger SOS request via parent component
    if (onSOSRequest) {
      onSOSRequest(emergencyType);
    }

    // Add confirmation message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "bot",
        text: `SOS request for ${emergencyType} has been sent! Help is on the way. Stay safe!`,
        timestamp: new Date(),
      },
    ]);

    setSOSContext(null);
  };

  const getEmergencyTypeLabel = (type) => {
    const labels = {
      ambulance: "Ambulance",
      fire: "Fire Emergency",
      ngo: "NGO Support",
    };
    return labels[type] || "Emergency Services";
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 group"
          aria-label="Open Safety Chatbot"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            <Bot className="h-3 w-3" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">SafeNow Assistant</h3>
                <p className="text-xs text-white/80">Safety Guidance</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close chatbot"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
            {messages.map((message) => {
              if (message.type === "sos-suggestion") {
                return (
                  <div
                    key={message.id}
                    className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 mb-3">
                          Do you want to send an SOS request for{" "}
                          {getEmergencyTypeLabel(message.emergencyType)}?
                        </p>
                        <button
                          onClick={() => handleSOSClick(message.emergencyType)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full flex items-center justify-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Send SOS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "bot" && (
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-full">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : message.isError
                          ? "bg-red-900/30 border border-red-500/30 text-red-200"
                          : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {message.type === "user" && (
                    <div className="flex-shrink-0">
                      <div className="bg-gray-700 p-2 rounded-full">
                        <User className="h-4 w-4 text-gray-200" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-full">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a safety question..."
                disabled={isLoading}
                className="flex-1 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              For life-threatening emergencies, use the main SOS button
            </p>
          </div>
        </div>
      )}
    </>
  );
};

SafetyChatbot.propTypes = {
  onSOSRequest: PropTypes.func.isRequired,
  userLocation: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    accuracy: PropTypes.number,
  }),
};

export default SafetyChatbot;
