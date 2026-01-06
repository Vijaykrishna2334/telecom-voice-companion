import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrbState = "idle" | "listening" | "processing" | "speaking";

interface VoiceInterfaceProps {
  sessionId: string;
}

const VoiceInterface = ({ sessionId }: VoiceInterfaceProps) => {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);

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
        // Audio data - play it
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
        break;
      case "stop_audio":
        setOrbState("listening");
        break;
    }
  };

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

  const getOrbAnimation = () => {
    switch (orbState) {
      case "listening":
        return "animate-orb-listening";
      case "processing":
        return "animate-orb-pulse";
      case "speaking":
        return "animate-orb-speaking";
      default:
        return "";
    }
  };

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

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {/* Main Orb */}
      <div className="relative mb-12">
        {/* Outer ripples */}
        {isConnected && (
          <>
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ripple" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ripple" style={{ animationDelay: "-0.5s" }} />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ripple" style={{ animationDelay: "-1s" }} />
          </>
        )}

        {/* Orb container */}
        <div
          className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full cursor-pointer transition-all duration-500 ${getOrbAnimation()}`}
          onClick={isConnected ? undefined : startVoice}
          style={{
            background: isConnected
              ? "radial-gradient(circle at 30% 30%, hsl(183 100% 70%) 0%, hsl(183 100% 50%) 30%, hsl(200 100% 40%) 70%, hsl(222 47% 15%) 100%)"
              : "radial-gradient(circle at 30% 30%, hsl(183 100% 40%) 0%, hsl(183 100% 30%) 30%, hsl(200 100% 25%) 70%, hsl(222 47% 12%) 100%)",
            boxShadow: isConnected
              ? "0 0 80px hsl(183 100% 50% / 0.5), 0 0 160px hsl(183 100% 50% / 0.25), inset 0 0 60px hsl(183 100% 70% / 0.3)"
              : "0 0 40px hsl(183 100% 50% / 0.2), inset 0 0 30px hsl(183 100% 50% / 0.1)",
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-xl" />
          
          {/* Highlight */}
          <div 
            className="absolute top-8 left-8 w-16 h-16 rounded-full opacity-60"
            style={{
              background: "radial-gradient(circle, hsl(0 0% 100% / 0.4) 0%, transparent 70%)",
            }}
          />

          {/* Status indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isConnected && (
              <Mic className="w-16 h-16 text-primary-foreground/80" />
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-8">
        <p className="text-lg font-medium text-foreground mb-2">{getStatusText()}</p>
        {orbState === "listening" && isMuted && (
          <p className="text-sm text-destructive">Microphone muted</p>
        )}
      </div>

      {/* Transcript & Response */}
      {(transcript || response) && (
        <div className="w-full max-w-lg space-y-4 mb-8">
          {transcript && (
            <div className="p-4 rounded-xl glass">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary mb-1">Assistant:</p>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {isConnected && (
          <Button
            variant={isMuted ? "destructive" : "glass"}
            size="lg"
            onClick={toggleMute}
            className="rounded-full w-14 h-14"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
        )}

        <Button
          variant={isConnected ? "destructive" : "glow"}
          size="lg"
          onClick={isConnected ? stopVoice : startVoice}
          className="rounded-full w-16 h-16"
        >
          {isConnected ? <PhoneOff className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
        </Button>
      </div>
    </div>
  );
};

export default VoiceInterface;
