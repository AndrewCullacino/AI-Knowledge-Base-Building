import { useState, useRef, useCallback } from "react";

interface UseVoiceInputReturn {
  isRecording: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
}

export const useVoiceInput = (): UseVoiceInputReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Voice input is not supported in this browser");
      return;
    }

    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder with appropriate MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Microphone permission denied. Please allow microphone access.");
        } else if (err.name === 'NotFoundError') {
          setError("No microphone found. Please connect a microphone.");
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      } else {
        setError("Failed to start recording");
      }
      setIsRecording(false);
    }
  }, [isSupported]);

  const processAudio = async () => {
    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });

      // Send to backend for transcription
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.text) {
        setTranscript(result.text);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (err) {
      console.error("Error processing audio:", err);
      if (err instanceof Error) {
        setError(`Transcription failed: ${err.message}`);
      } else {
        setError("Transcription failed");
      }
    } finally {
      setIsProcessing(false);
      cleanupRecording();
    }
  };

  const cleanupRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
  };

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isSupported,
    isProcessing,
    startRecording,
    stopRecording,
    resetTranscript,
  };
};
