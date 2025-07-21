import { useState, useRef, useCallback, useEffect } from 'react';
import { aiChatService, EphemeralToken } from '../services/aiChatService';

export interface RealtimeMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

export interface RealtimeConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

export const useRealtimeChat = () => {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    status: 'disconnected'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const tokenRef = useRef<EphemeralToken | null>(null);

  // Инициализация WebRTC соединения
  const connect = useCallback(async () => {
    if (connectionState.status === 'connecting' || connectionState.status === 'connected') {
      return;
    }

    try {
      setConnectionState({ status: 'connecting' });

      // Получаем ephemeral token
      const token = await aiChatService.getEphemeralToken();
      tokenRef.current = token;

      // Создаем peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Настраиваем воспроизведение удаленного аудио
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        setIsPlaying(true);
      };

      // Добавляем локальный аудиотрек для микрофона
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      // Настраиваем data channel для отправки и получения событий
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      
      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          handleRealtimeEvent(event);
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      });

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnectionState({ status: 'connected' });
        
        // Отправляем конфигурацию сессии
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Ты полезный AI-ассистент для образовательной платформы. Отвечай на русском языке кратко и по делу.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        }));
      });

      dc.addEventListener('error', (error) => {
        console.error('Data channel error:', error);
        setConnectionState({ 
          status: 'error', 
          error: 'Ошибка канала данных' 
        });
      });

      // Создаем offer и устанавливаем локальное описание
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Отправляем SDP на OpenAI Realtime API
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-10-01';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${token.client_secret.value}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP request failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      };

      await pc.setRemoteDescription(answer);

      // Обработчики состояния соединения
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setConnectionState({ status: 'disconnected' });
        }
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState({ 
        status: 'error', 
        error: 'Не удалось подключиться к AI-ассистенту' 
      });
    }
  }, [connectionState.status]);

  // Отключение от Realtime API
  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }

    setConnectionState({ status: 'disconnected' });
    setIsRecording(false);
    setIsPlaying(false);
  }, []);

  // Обработка событий от Realtime API
  const handleRealtimeEvent = useCallback((event: any) => {
    console.log('Realtime event:', event);

    switch (event.type) {
      case 'conversation.item.created':
        if (event.item.type === 'message') {
          const message: RealtimeMessage = {
            id: event.item.id,
            type: event.item.role === 'user' ? 'user' : 'assistant',
            content: event.item.content?.[0]?.text || event.item.content?.[0]?.transcript || '[Аудио сообщение]',
            timestamp: new Date(),
            isAudio: event.item.content?.[0]?.type === 'input_audio'
          };
          
          setMessages(prev => [...prev, message]);
        }
        break;

      case 'response.audio_transcript.delta':
        // Обновление транскрипции аудио-ответа
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + event.delta }
            ];
          } else {
            return [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: event.delta,
                timestamp: new Date(),
                isAudio: true
              }
            ];
          }
        });
        break;

      case 'response.text.delta':
        // Обновление текстового ответа
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && !lastMessage.isAudio) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + event.delta }
            ];
          } else {
            return [
              ...prev,
              {
                id: `assistant-text-${Date.now()}`,
                type: 'assistant',
                content: event.delta,
                timestamp: new Date()
              }
            ];
          }
        });
        break;

      case 'response.audio.done':
        setIsPlaying(false);
        break;

      case 'input_audio_buffer.speech_started':
        setIsRecording(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsRecording(false);
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        setConnectionState({ 
          status: 'error', 
          error: event.error.message || 'Ошибка API' 
        });
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  }, []);

  // Отправка текстового сообщения
  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || connectionState.status !== 'connected') {
      console.error('Data channel not connected');
      return;
    }

    const message: RealtimeMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);

    // Отправляем сообщение в Realtime API
    dcRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));

    // Запрашиваем ответ
    dcRef.current.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Отвечай кратко и по делу на русском языке.'
      }
    }));
  }, [connectionState.status]);

  // Переключение передачи аудио (push-to-talk)
  const togglePushToTalk = useCallback((enabled: boolean) => {
    if (!dcRef.current || connectionState.status !== 'connected') {
      return;
    }

    if (enabled) {
      // Начинаем передачу аудио
      dcRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: '' // Аудио будет передаваться через WebRTC
      }));
    } else {
      // Заканчиваем передачу аудио
      dcRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));

      // Запрашиваем ответ
      dcRef.current.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio']
        }
      }));
    }
  }, [connectionState.status]);

  // Очистка чата
  const clearMessages = useCallback(() => {
    setMessages([]);
    
    if (dcRef.current && connectionState.status === 'connected') {
      // Очищаем историю разговора
      dcRef.current.send(JSON.stringify({
        type: 'conversation.item.truncate',
        conversation_id: 'default',
        content_index: 0
      }));
    }
  }, [connectionState.status]);

  // Проверка валидности токена
  useEffect(() => {
    if (tokenRef.current && !aiChatService.isTokenValid(tokenRef.current)) {
      disconnect();
    }
  }, [disconnect]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    connectionState,
    isRecording,
    isPlaying,
    connect,
    disconnect,
    sendTextMessage,
    togglePushToTalk,
    clearMessages
  };
};
