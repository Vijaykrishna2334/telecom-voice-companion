import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Mic, MicOff, Phone, PhoneOff, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleSphere from "./ParticleSphere";

type OrbState = "idle" | "listening" | "processing" | "speaking";

interface VoiceInterfaceProps {
  sessionId: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const VoiceInterface = ({ sessionId }: VoiceInterfaceProps) => {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/voice/realtime/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setOrbState("idle");
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        playAudio(event.data);
      } else {
        const data = JSON.parse(event.data);
        handleWebSocketEvent(data);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setOrbState("idle");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [sessionId]);

  const handleWebSocketEvent = (data: any) => {
    switch (data.type) {
      case "speech_start":
        setOrbState("listening");
        break;
      case "speech_end":
        setOrbState("processing");
        break;
      case "processing":
        if (data.stage === "transcribing") setOrbState("processing");
        if (data.stage === "thinking") setOrbState("processing");
        break;
      case "transcript":
        setTranscript(data.text || "");
        // Add user message to chat history
        if (data.text) {
          setChatHistory(prev => [...prev, {
            id: `user_${Date.now()}`,
            type: "user",
            text: data.text,
            timestamp: new Date()
          }]);
        }
        break;
      case "token":
        setResponse((prev) => prev + (data.text || ""));
        break;
      case "audio_start":
        setOrbState("speaking");
        break;
      case "audio_end":
        break;
      case "response_complete":
        setResponse(data.text || "");
        // Add assistant message to chat history
        if (data.text) {
          setChatHistory(prev => [...prev, {
            id: `assistant_${Date.now()}`,
            type: "assistant",
            text: data.text,
            timestamp: new Date()
          }]);
        }
        break;
      case "stop_audio":
        setOrbState("listening");
        break;
    }
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatHistory]);

  const playAudio = async (blob: Blob) => {
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setOrbState("listening");
      };
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(512, 1, 1);
      processorRef.current = processor;

      connectWebSocket();

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          const inputData = e.inputBuffer.getChannelData(0);
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new Int16Array(buffer);
          for (let i = 0; i < inputData.length; i++) {
            view[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          wsRef.current.send(buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setOrbState("listening");
    } catch (error) {
      console.error("Error starting voice:", error);
    }
  };

  const stopVoice = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsConnected(false);
    setOrbState("idle");
    setTranscript("");
    setResponse("");
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const getStatusText = () => {
    switch (orbState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return isConnected ? "Ready" : "Click to start";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black flex">
      {/* Main Sphere Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* 3D Particle Sphere - Large and Centered */}
        <div className="mb-8">
          <Suspense fallback={
            <div className="w-[400px] h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full bg-black flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
          }>
            <ParticleSphere
              isActive={isConnected}
              isSpeaking={orbState === "speaking"}
              onClick={isConnected ? undefined : startVoice}
              size="large"
            />
          </Suspense>
        </div>

        {/* Status Text */}
        <p className="text-lg font-medium text-white/70 mb-8">{getStatusText()}</p>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {isConnected && (
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full w-14 h-14 border-white/20 bg-white/5 hover:bg-white/10"
            >
              {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            </Button>
          )}

          <Button
            variant={isConnected ? "destructive" : "outline"}
            size="lg"
            onClick={isConnected ? stopVoice : startVoice}
            className={`rounded-full w-16 h-16 ${!isConnected ? "border-white/30 bg-white/10 hover:bg-white/20" : ""}`}
          >
            {isConnected ? <PhoneOff className="w-7 h-7" /> : <Phone className="w-7 h-7 text-white" />}
          </Button>
        </div>

        {/* Current Transcript/Response overlay */}
        {(transcript || response) && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-lg text-center px-4">
            {transcript && (
              <p className="text-white/50 text-sm mb-2">"{transcript}"</p>
            )}
            {response && (
              <p className="text-white/80 text-base">{response}</p>
            )}
          </div>
        )}
      </div>

      {/* Chat Transcript Panel - Right Side */}
      <div 
        className={`relative transition-all duration-300 ease-out ${
          isPanelOpen ? 'w-80 lg:w-96' : 'w-0'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 w-10 h-20 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-l-xl flex items-center justify-center transition-all"
        >
          {isPanelOpen ? (
            <ChevronRight className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white/60" />
          )}
        </button>

        {/* Panel Content */}
        <div className={`h-full bg-white/[0.02] backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden ${!isPanelOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white/70" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/90">Transcript</h3>
              <p className="text-xs text-white/40">{chatHistory.length} messages</p>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No messages yet</p>
                <p className="text-white/25 text-xs mt-1">Start a conversation to see the transcript</p>
              </div>
            ) : (
              chatHistory.map((message) => (
                <div 
                  key={message.id}
                  className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-white/10 text-white/90 rounded-br-md' 
                        : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 text-white/90 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                  <span className="text-[10px] text-white/30 mt-1 px-2">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;
