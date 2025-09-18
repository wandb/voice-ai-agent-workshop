import { useState, useEffect, useRef } from "react";
import { startAudioPlayerWorklet } from "@/lib/audio-player";
import { startAudioRecorderWorklet, stopMicrophone } from "@/lib/audio-recorder";

export function useAudio(
  onAudioData: (data: ArrayBuffer) => void
): {
  startAudio: () => void;
  stopAudio: () => void;
  isAudioStarted: boolean;
  playAudio: (data: ArrayBuffer) => void;
} {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const audioPlayerNode = useRef<AudioWorkletNode | null>(null);
  const audioRecorderNode = useRef<AudioWorkletNode | null>(null);
  const audioRecorderContext = useRef<AudioContext | null>(null);
  const micStream = useRef<MediaStream | null>(null);

  const startAudio = async () => {
    try {
      const [playerNode] = await startAudioPlayerWorklet();
      audioPlayerNode.current = playerNode;

      const [recorderNode, recorderContext, stream] = await startAudioRecorderWorklet(
        onAudioData
      );
      audioRecorderNode.current = recorderNode;
      audioRecorderContext.current = recorderContext;
      micStream.current = stream;

      setIsAudioStarted(true);
    } catch (error) {
      console.error("Error starting audio:", error);
    }
  };

  const stopAudio = () => {
    try {
      // Stop and clean up the microphone stream
      if (micStream.current) {
        stopMicrophone(micStream.current);
        micStream.current = null;
      }

      // Disconnect and clean up the audio recorder node
      if (audioRecorderNode.current) {
        audioRecorderNode.current.disconnect();
        audioRecorderNode.current = null;
      }

      // Close the audio recorder context
      if (audioRecorderContext.current) {
        audioRecorderContext.current.close();
        audioRecorderContext.current = null;
      }

      console.log("Audio recording stopped and cleaned up");
    } catch (error) {
      console.error("Error stopping audio:", error);
    } finally {
      setIsAudioStarted(false);
    }
  };

  const playAudio = (data: ArrayBuffer) => {
    if (audioPlayerNode.current) {
      audioPlayerNode.current.port.postMessage(data);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return { startAudio, stopAudio, isAudioStarted, playAudio };
}
