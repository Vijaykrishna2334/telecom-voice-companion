import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleSphere from "./ParticleSphere";

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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
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

      {/* Transcript/Response overlay */}
      {(transcript || response) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-lg text-center">
          {transcript && (
            <p className="text-white/50 text-sm mb-2">"{transcript}"</p>
          )}
          {response && (
            <p className="text-white/80 text-base">{response}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
