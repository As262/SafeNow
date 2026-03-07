import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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

  // ── Voice input state ──────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  // true once onaudiostart fires — tells user the mic is actually ready
  const [micReady, setMicReady] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  // Tracks which bot message is currently being spoken (null = none)
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const recognitionRef = useRef(null);
  // Ref so toggleRecording always calls the latest sendMessageWithText
  // without needing it as a useCallback dep (avoids stale closure).
  const sendMessageRef = useRef(null);
  // Accumulates confirmed (final) transcript segments across result events
  const finalTranscriptRef = useRef("");
  // Auto-send timer: fires after SILENCE_MS of no new final results
  const silenceTimerRef = useRef(null);
  const SILENCE_MS = 1800;
  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const synthSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  // ──────────────────────────────────────────────────────────────────────────
  // Stable session ID for the lifetime of this component instance.
  // Cleared only when the user refreshes the page (new component mount).
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

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

  // Stop recognition and synthesis when the panel is closed
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      if (synthSupported) window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Voice helpers ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setMicReady(false);
  }, []);

  const speakText = useCallback(
    (text, msgId) => {
      if (!synthSupported) return;
      // If this message is already speaking, stop it
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
        return;
      }
      window.speechSynthesis.cancel();
      // Strip markdown-style bullets/numbers so TTS reads cleanly
      const clean = text.replace(/^[•\-*\d]+[.)\s]*/gm, "").trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.25;
      utterance.pitch = 1;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    },
    [synthSupported, speakingMsgId],
  );

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Manual stop — send whatever was accumulated
      const transcript = finalTranscriptRef.current.trim();
      stopRecording();
      if (transcript) {
        setInputMessage(transcript);
        setTimeout(() => sendMessageRef.current?.(transcript), 50);
      }
      return;
    }

    setVoiceError("");
    finalTranscriptRef.current = "";
    setInputMessage("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // onstart fires immediately — audio pipeline not ready yet
    recognition.onstart = () => {
      setIsRecording(true);
      setMicReady(false);
    };

    // onaudiostart fires when audio capture actually begins (~200ms later)
    // Only show "Speak now" after this — fixes first-word cut-off
    recognition.onaudiostart = () => setMicReady(true);

    recognition.onresult = (event) => {
      // Any new speech resets the silence countdown
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          newFinal += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (newFinal) {
        finalTranscriptRef.current =
          (finalTranscriptRef.current
            ? finalTranscriptRef.current.trimEnd() + " "
            : "") + newFinal.trim();
      }
      setInputMessage(
        finalTranscriptRef.current + (interim ? " " + interim : ""),
      );

      // After every confirmed word, start/reset the silence timer
      if (newFinal) {
        silenceTimerRef.current = setTimeout(() => {
          const transcript = finalTranscriptRef.current.trim();
          stopRecording();
          if (transcript) {
            setInputMessage(transcript);
            sendMessageRef.current?.(transcript);
          }
        }, SILENCE_MS);
      }
    };

    recognition.onerror = (event) => {
      stopRecording();
      const errorMessages = {
        "not-allowed": "Microphone access denied. Please allow microphone permission in your browser.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Network error during speech recognition. Please try again.",
        "aborted": "",
      };
      const msg = errorMessages[event.error] ?? `Voice error: ${event.error}`;
      if (msg) setVoiceError(msg);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      stopRecording();
      setVoiceError("Could not start microphone. Please try again.");
    }
  }, [isRecording, stopRecording]);  // SILENCE_MS is a module-level const, no need in deps
  // ──────────────────────────────────────────────────────────────────────────

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
      police: [
        "police",
        "theft",
        "stolen",
        "robbery",
        "assault",
        "attacked",
        "threat",
        "threatening",
        "weapon",
        "knife",
        "gun",
        "following",
        "stalking",
        "harass",
        "crime",
        "break in",
        "breaking in",
        "intruder",
        "trespassing",
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
    const userText = userMessage.toLowerCase();
    const aiText = aiResponse.toLowerCase();

    // ── Tier 1: Immediate emergencies ──────────────────────────────────────
    // User says these words → show SOS immediately, no AI check needed
    const immediateEmergency = [
      // Personal danger
      "following me", "chasing me", "being followed", "someone is after",
      "threatening me", "attacked", "attacking me", "being attacked",
      "assaulted", "mugged", "robbery", "knife", "gun", "weapon",
      "trapped", "can't get out", "locked in",
      // Serious medical
      "unconscious", "not breathing", "stopped breathing", "heart attack",
      "chest pain", "stroke", "seizure", "severe bleeding", "bleeding won't stop",
      "deep cut", "broken bone", "fracture", "can't move", "head injury",
      "overdose", "poisoned", "allergic reaction", "anaphylaxis",
      // Hazards
      "fire", "smoke", "explosion", "gas leak", "building collapse",
      "flood", "drowning",
    ];

    if (immediateEmergency.some((p) => userText.includes(p))) return true;

    // ── Tier 2: Moderate / social emergencies ─────────────────────────────
    // User has a real but non-immediate problem AND AI recommends seeking help.
    // Both conditions must be true — prevents generic questions from triggering.
    const moderateSituation = [
      "homeless", "no shelter", "no food", "starving", "evicted",
      "abuse", "abused", "domestic violence", "violence at home",
      "mental health", "suicidal", "self harm", "crisis",
      "injured", "bleeding", "burned", "burn", "fell", "accident",
      "broke my", "broken", "sprain", "twisted", "missing", "lost child",
    ];

    const aiRecommendsHelp = [
      "seek medical", "medical attention", "call emergency", "emergency services",
      "contact", "reach out", "ngo", "shelter", "social services",
      "crisis hotline", "support line", "hospital", "doctor", "ambulance",
    ];

    const userHasRealProblem = moderateSituation.some((p) => userText.includes(p));
    const aiSaysGetHelp = aiRecommendsHelp.some((p) => aiText.includes(p));

    return userHasRealProblem && aiSaysGetHelp;
  };

  const sendMessageWithText = useCallback(async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;
    setVoiceError("");
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
      // Call the chatbot API — include session_id so the backend can
      // retrieve and update this session's conversation history.
      const response = await fetch("/api/sos/chatbot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionIdRef.current,
        }),
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

        // Map frontend key to backend TYPE_CHOICES value
        const typeMap = {
          ambulance: "Ambulance",
          fire: "Fire Emergency",
          police: "Police",
          ngo: "NGO Support",
        };
        const backendType = typeMap[emergencyType] || "Ambulance";

        setSOSContext({
          type: backendType,
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
              emergencyType: backendType,
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
  // speakText is a stable callback — safe to list as dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, speakText, sessionIdRef]);

  // Keep the ref in sync so toggleRecording always has the latest version
  sendMessageRef.current = sendMessageWithText;

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessageWithText(inputMessage.trim());
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
      Ambulance: "Ambulance",
      "Fire Emergency": "Fire Emergency",
      Police: "Police",
      "NGO Support": "NGO Support",
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
            <div className="flex items-center gap-2">
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
                    {message.type === "bot" && !message.isError && synthSupported && (
                      <button
                        onClick={() => speakText(message.text, message.id)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        title={speakingMsgId === message.id ? "Stop speaking" : "Listen to this response"}
                        aria-label={speakingMsgId === message.id ? "Stop" : "Speak"}
                      >
                        {speakingMsgId === message.id ? (
                          <><VolumeX className="h-3.5 w-3.5" /><span>Stop</span></>
                        ) : (
                          <><Volume2 className="h-3.5 w-3.5" /><span>Listen</span></>
                        )}
                      </button>
                    )}
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
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 text-xs mb-2 px-1"
                   style={{ color: micReady ? "#f87171" : "#facc15" }}>
                <span
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ background: micReady ? "#f87171" : "#facc15" }}
                />
                {micReady
                  ? "Speak now — auto-sends after you pause"
                  : "Preparing mic…"}
              </div>
            )}
            {/* Voice error feedback */}
            {voiceError && (
              <div className="text-yellow-400 text-xs mb-2 px-1">
                {voiceError}
              </div>
            )}
            <div className="flex gap-2">
              {/* Microphone button */}
              <button
                onClick={speechSupported ? toggleRecording : undefined}
                disabled={!speechSupported || isLoading}
                title={
                  speechSupported
                    ? isRecording
                      ? "Stop recording"
                      : "Speak your question"
                    : "Voice input not supported in this browser"
                }
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={`p-2 rounded-lg transition-colors disabled:cursor-not-allowed ${
                  !speechSupported
                    ? "bg-gray-700 text-gray-600"
                    : isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Listening…" : "Ask a safety question..."}
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
