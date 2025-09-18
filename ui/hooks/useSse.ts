import { useEffect, useRef, useState } from "react";

export function useSse(sessionId: string, isAudio: boolean, enabled: boolean = true, serverUrl: string = 'localhost:8000') {
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId || !enabled) {
      // Ensure disconnection and reset state when disabled or no session
      if (eventSourceRef.current) {
        try { eventSourceRef.current.close(); } catch {}
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const sseUrl = `http://${serverUrl}/events/${sessionId}?is_audio=${isAudio}`;
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("SSE connection opened.");
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        setConnectionError(null);
      } catch (error) {
        console.error("Error parsing SSE message:", error);
        setConnectionError("Failed to parse server message");
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsConnected(false);
      setConnectionError(`Connection failed: Unable to connect to ${serverUrl}`);
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      try { eventSource.close(); } catch {}
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, isAudio, enabled, serverUrl]);

  return { lastMessage, isConnected, connectionError };
}
