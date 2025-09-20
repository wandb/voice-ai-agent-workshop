"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useSse } from "@/hooks/useSse";
import { useAudio } from "@/hooks/useAudio";
import { GridBeams } from "@/components/grid-beams";
import { Bot, Settings, X, Check } from "lucide-react";

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Merge incremental text chunks from SSE without duplicating content
function mergeStreamingText(existing: string, incoming: string): string {
  if (!existing) return incoming;
  if (!incoming) return existing;
  // If server sends cumulative snapshots, prefer the latest snapshot
  if (incoming.startsWith(existing)) return incoming;
  // If the incoming chunk is already contained, ignore
  if (existing.includes(incoming)) return existing;
  // Merge with maximal overlap between the suffix of existing and prefix of incoming
  const maxOverlap = Math.min(existing.length, incoming.length);
  let overlap = 0;
  for (let i = 1; i <= maxOverlap; i++) {
    if (existing.slice(-i) === incoming.slice(0, i)) overlap = i;
  }
  return existing + incoming.slice(overlap);
}

export default function Home() {
  type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
  };
  const [sessionId] = useState(Math.random().toString().substring(10));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isAudio, setIsAudio] = useState(false);
  const [sseEnabled, setSseEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sse-server-url") || "localhost:8000";
    }
    return "localhost:8000";
  });
  const [tempUrl, setTempUrl] = useState(serverUrl);
  const {
    lastMessage: lastSseMessage,
    isConnected,
    connectionError,
  } = useSse(sessionId, isAudio, sseEnabled, serverUrl);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAudioData = (data: ArrayBuffer) => {
    sendMessage(arrayBufferToBase64(data), "audio/pcm");
  };

  const { startAudio, stopAudio, isAudioStarted, playAudio } =
    useAudio(handleAudioData);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (lastSseMessage) {
      if (lastSseMessage.mime_type === "text/plain") {
        const chunk = String(lastSseMessage.data ?? "");
        setMessages((previousMessages) => {
          const nextMessages = [...previousMessages];
          const last = nextMessages[nextMessages.length - 1];
          if (!last || last.role !== "assistant") {
            nextMessages.push({
              id: generateId(),
              role: "assistant",
              content: chunk,
            });
          } else {
            last.content = mergeStreamingText(last.content, chunk);
            nextMessages[nextMessages.length - 1] = { ...last };
          }
          return nextMessages;
        });
      } else if (lastSseMessage.mime_type === "audio/pcm") {
        playAudio(base64ToArrayBuffer(lastSseMessage.data));
      }
    }
  }, [lastSseMessage, playAudio]);

  const sendMessage = async (data: string, mimeType: string) => {
    try {
      await fetch(`http://${serverUrl}/send/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mime_type: mimeType,
          data: data,
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() !== "") {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
      };
      const assistantPlaceholder: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      sendMessage(message, "text/plain");
      setMessage("");
    }
  };

  const handleStartAudio = () => {
    setIsAudio(true);
    startAudio();
  };

  const handleToggleSse = () => {
    setSseEnabled((v) => !v);
  };

  const handleSaveSettings = () => {
    setServerUrl(tempUrl);
    localStorage.setItem("sse-server-url", tempUrl);
    setShowSettings(false);
  };

  const handleCancelSettings = () => {
    setTempUrl(serverUrl);
    setShowSettings(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sse-server-url", serverUrl);
    }
  }, [serverUrl]);

  return (
    <GridBeams className="h-screen w-full">
      <div className="font-sans flex flex-col h-screen w-full overflow-hidden">
        <header className="sticky top-0 z-50 w-full flex items-center justify-between p-4 bg-black/30 backdrop-blur-xl border-b border-white/15">
          <div className="flex items-center gap-3 text-white rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_30px_-10px_rgba(0,0,0,0.7)]">
            <Bot className="size-6 text-white" />
            <span className="text-lg font-semibold text-white">
              Voice Agent
            </span>
          </div>
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-white/15 border border-white/20 backdrop-blur-xl h-9 w-9 p-0"
            >
              <Settings className="size-4" />
            </Button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[90vw] p-3 sm:p-4 bg-black/85 backdrop-blur-xl border border-white/25 rounded-xl shadow-2xl z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Settings</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelSettings}
                    className="text-white/70 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Server URL
                    </label>
                    <Input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="localhost:8000"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50 text-sm w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveSettings}
                      className="flex-1 bg-white/15 hover:bg-white/25 text-white border border-white/25 h-8"
                    >
                      <Check className="size-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelSettings}
                      className="text-white/80 hover:text-white hover:bg-white/15 h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 flex flex-col p-2 sm:p-4 lg:p-6 pt-4 overflow-hidden">
          <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col border-white/25 bg-white/12 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_20px_60px_-20px_rgba(0,0,0,0.7)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-semibold">
                  ADK Streaming Test
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isConnected ? "secondary" : "destructive"}
                    className={`backdrop-blur-md border text-white font-medium ${
                      isConnected
                        ? "bg-green-500/20 border-green-400/40 text-green-100"
                        : "bg-red-500/20 border-red-400/40 text-red-100"
                    }`}
                  >
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant={isConnected ? "destructive" : "secondary"}
                    onClick={handleToggleSse}
                    className={`backdrop-blur-md border text-white font-medium h-8 ${
                      isConnected
                        ? "bg-red-500/20 border-red-400/40 hover:bg-red-500/30 text-red-100"
                        : "bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/30 text-blue-100"
                    }`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {connectionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-100 text-sm backdrop-blur-md">
                  <div className="font-medium mb-1">Connection Error</div>
                  <div className="text-red-200/90">{connectionError}</div>
                </div>
              )}
              <div className="flex-1 min-h-0 overflow-y-auto border border-white/20 rounded-xl p-4 space-y-3 bg-white/8 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-15px_rgba(0,0,0,0.6)] ${
                        msg.role === "user"
                          ? "bg-[linear-gradient(180deg,rgba(59,130,246,0.35),rgba(59,130,246,0.18))] border-blue-400/50 text-blue-50"
                          : "bg-[linear-gradient(180deg,rgba(75,85,99,0.35),rgba(75,85,99,0.18))] border-gray-400/40 text-gray-50"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <Separator className="my-4 bg-white/20" />

              <form
                onSubmit={handleSendMessage}
                className="flex flex-col gap-2"
              >
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[84px] rounded-2xl border-white/25 bg-white/8 backdrop-blur-md placeholder:text-white/70 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] focus:border-white/40 focus:bg-white/10"
                />
                <div className="flex items-center gap-2 flex-wrap justify-start">
                  <Button
                    type="submit"
                    disabled={!isConnected || message.trim() === ""}
                    className="backdrop-blur-md border-blue-400/40 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 disabled:opacity-50 disabled:bg-white/10 disabled:border-white/20 disabled:text-white/60 h-9 font-medium"
                  >
                    Send
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStartAudio}
                    disabled={isAudioStarted}
                    className="backdrop-blur-md border-green-400/40 bg-green-500/20 hover:bg-green-500/30 text-green-100 disabled:opacity-50 disabled:bg-white/10 disabled:border-white/20 disabled:text-white/60 h-9 font-medium"
                  >
                    Start Audio
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAudio(false);
                      stopAudio();
                    }}
                    disabled={!isAudioStarted}
                    className="backdrop-blur-md border-orange-400/40 bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 disabled:opacity-50 disabled:bg-white/10 disabled:border-white/20 disabled:text-white/60 h-9 font-medium"
                  >
                    Stop Audio
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
        <div className="px-2 sm:px-4 lg:px-6 pb-2 sm:pb-4 pt-2 sm:pt-4 flex-shrink-0">
          <footer className="w-full flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-white/90 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 sm:px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] gap-2 sm:gap-0">
            <div className="flex flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <span
                  aria-hidden="true"
                  className="text-sm sm:text-lg text-white/90"
                >
                  ©
                </span>
                <span className="text-white whitespace-nowrap font-medium">
                  Weights &amp; Biases
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-4">
              <div className="text-white/90 whitespace-nowrap">MIT License</div>
              <a
                href="https://github.com/wandb/voice-ai-agent-workshop"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:underline-offset-4 text-white/90 hover:text-white whitespace-nowrap transition-colors"
              >
                Source code
              </a>
            </div>
          </footer>
        </div>
      </div>
    </GridBeams>
  );
}

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
      return crypto.randomUUID();
  } catch {}
  return Math.random().toString(36).slice(2);
}
