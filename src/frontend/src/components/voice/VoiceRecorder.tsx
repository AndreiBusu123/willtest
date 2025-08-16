import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  LinearProgress,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
} from '@mui/material';
import {
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Close,
  Send,
  Refresh,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import {
  startRecording,
  stopRecording,
  setAudioBlob,
  transcribeAudio,
  clearTranscription,
} from '../../store/slices/voiceSlice';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onClose: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isRecording, audioBlob, transcription, isTranscribing } = useSelector(
    (state: RootState) => state.voice
  );
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        dispatch(setAudioBlob(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      dispatch(startRecording());
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      dispatch(stopRecording());
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl!);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTranscribe = async () => {
    if (audioBlob) {
      const result = await dispatch(transcribeAudio(audioBlob));
      if (transcribeAudio.fulfilled.match(result)) {
        onTranscription(result.payload.text);
      }
    }
  };

  const handleReset = () => {
    dispatch(setAudioBlob(null));
    dispatch(clearTranscription());
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Voice Message</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          {/* Recording indicator */}
          {isRecording && (
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.error.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                    '50%': {
                      transform: 'scale(1.05)',
                      opacity: 0.8,
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <Mic sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mt: 2 }}>
                {formatTime(recordingTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recording...
              </Typography>
            </Box>
          )}

          {/* Audio playback */}
          {audioUrl && !isRecording && (
            <Box sx={{ mb: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconButton onClick={handlePlayPause} color="primary">
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <Typography variant="body1" sx={{ ml: 2 }}>
                    {formatTime(recordingTime)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Transcription */}
          {transcription && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: theme.palette.success.light,
                color: theme.palette.success.contrastText,
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">{transcription}</Typography>
            </Paper>
          )}

          {/* Loading indicator */}
          {isTranscribing && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Transcribing...
              </Typography>
            </Box>
          )}

          {/* Control buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!isRecording && !audioBlob && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Mic />}
                onClick={handleStartRecording}
                color="error"
              >
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Stop />}
                onClick={handleStopRecording}
                color="primary"
              >
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && !transcription && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  Record Again
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                >
                  Transcribe
                </Button>
              </>
            )}

            {transcription && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  New Recording
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => onTranscription(transcription)}
                >
                  Use This Text
                </Button>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorder;