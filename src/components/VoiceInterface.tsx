import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Mic, MicOff, Phone, PhoneOff, Zap, Key, Users, Droplet, Grid3X3, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleSphere from "./ParticleSphere";

type OrbState = "idle" | "listening" | "processing" | "speaking";

interface VoiceInterfaceProps {
  sessionId: string;
}

interface AgentTask {
  id: number;
  name: string;
  status: "in_progress" | "completed" | "consent_required";
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

  const [tasks] = useState<AgentTask[]>([
    { id: 1, name: "Answer customer inquiries", status: "in_progress" },
    { id: 2, name: "Provide product recommendations", status: "completed" },
    { id: 3, name: "Assist with order processing", status: "completed" },
    { id: 4, name: "Handle customer complaints", status: "consent_required" },
  ]);

  const [stats] = useState({
    responseAccuracy: 99,
    customerSatisfaction: 96,
    taskCompletionRate: 91,
  });

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

  const getStatusBadge = (status: AgentTask["status"]) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Clock className="w-3 h-3" />
            In progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "consent_required":
        return (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            Consent required
          </span>
        );
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
    <div className="flex items-center justify-center h-full p-6 gap-6">
      {/* Left Panel - Agent Tasks */}
      <div className="hidden lg:flex flex-col w-80 h-[480px] rounded-2xl glass-strong p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Agent Tasks</h2>
          <p className="text-xs text-muted-foreground">Overview of all the tasks the agent is currently running</p>
        </div>

        <div className="flex-1 space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
            >
              <span className="text-sm text-foreground/90">{task.name}</span>
              {getStatusBadge(task.status)}
            </div>
          ))}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">You said:</p>
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
        )}
      </div>

      {/* Center - 3D Particle Sphere */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <Suspense fallback={
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-[2.5rem] bg-secondary/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          }>
            <ParticleSphere
              isActive={isConnected}
              isSpeaking={orbState === "speaking"}
              onClick={isConnected ? undefined : startVoice}
            />
          </Suspense>
        </div>

        {/* Status Text */}
        <p className="text-sm font-medium text-muted-foreground mb-6">{getStatusText()}</p>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <Button
              variant={isMuted ? "destructive" : "glass"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full w-12 h-12"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}

          <Button
            variant={isConnected ? "destructive" : "glow"}
            size="lg"
            onClick={isConnected ? stopVoice : startVoice}
            className="rounded-full w-14 h-14"
          >
            {isConnected ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Right Panel - Voice AI Agent */}
      <div className="hidden lg:flex flex-col w-72 h-[480px] rounded-2xl glass-strong p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {/* Agent Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Voice AI Agent</h2>
        </div>

        {/* Agent Tools */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-3">Agent Tools</p>
          <div className="flex items-center gap-2">
            {[Zap, Key, Users, Droplet, Grid3X3, Plus].map((Icon, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center border border-border/30 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Key Statistics */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-4">Key Statistics</p>

          {/* Response Accuracy */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/30 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Response Accuracy</p>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">{stats.responseAccuracy}%</span>
                <span className="text-xs text-emerald-400 ml-2">↑ 5%</span>
              </div>
              {/* Mini chart */}
              <div className="flex items-end gap-0.5 h-10">
                {[40, 55, 45, 60, 70, 65, 80, 75, 90, 85, 95, 99].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Other Stats */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Customer Satisfaction</p>
              <span className="text-xl font-bold text-foreground">{stats.customerSatisfaction}%</span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Task Completion Rate</p>
              <span className="text-xl font-bold text-foreground">{stats.taskCompletionRate}%</span>
            </div>
          </div>
        </div>

        {/* Response Display */}
        {response && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary mb-1">Assistant:</p>
            <p className="text-sm text-foreground line-clamp-3">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
