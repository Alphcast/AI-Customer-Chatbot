'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSend: (blob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    chunksRef.current = [];
    setDuration(0);
    setAudioUrl(null);
    setIsPlaying(false);
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('preview');

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed');
        setStatus('idle');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100 as unknown as undefined);
      setStatus('recording');

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed++;
        setDuration(elapsed);
        if (elapsed >= 300) {
          mediaRecorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied');
      } else {
        setError('Could not start recording');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePlayPreview = useCallback(() => {
    if (!audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play().catch(() => setError('Playback failed'));
    setIsPlaying(true);
  }, [audioUrl, isPlaying]);

  const handleSend = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || 'audio/webm',
    });
    onSend(blob);
    cleanup();
    setStatus('idle');
  }, [onSend, cleanup]);

  const handleCancel = useCallback(() => {
    cleanup();
    setStatus('idle');
    setError(null);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startRecording}
        disabled={disabled}
        aria-label="Start voice recording"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        status === 'recording' ? 'bg-destructive/10 animate-pulse' : 'bg-muted',
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'recording' && (
        <>
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" aria-hidden="true" />
          <span className="text-sm font-mono tabular-nums">{formatDuration(duration)}</span>
          <span className="text-xs text-muted-foreground">Recording...</span>
          <div className="flex-1 flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          </div>
        </>
      )}

      {status === 'preview' && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePlayPreview}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm font-mono tabular-nums">{formatDuration(duration)}</span>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleCancel}
            aria-label="Cancel recording"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            aria-label="Send voice message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}

      {error && (
        <span className="text-xs text-destructive ml-2">{error}</span>
      )}
    </div>
  );
}
