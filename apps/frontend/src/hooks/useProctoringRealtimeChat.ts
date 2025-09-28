import { useState, useRef, useCallback, useEffect } from 'react';
import { aiChatService, EphemeralToken } from '../services/aiChatService';
import { proctoringService } from '../services/proctoringService';

export interface ProctoringRealtimeMessage {
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isAudio?: boolean;
}

export interface ProctoringConnectionState {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    error?: string;
}

export const useProctoringRealtimeChat = (sessionId: number | null) => {
    console.log('useProctoringRealtimeChat initialized with sessionId:', sessionId);
    const [messages, setMessages] = useState<ProctoringRealtimeMessage[]>([]);
    const [connectionState, setConnectionState] = useState<ProctoringConnectionState>({
        status: 'disconnected'
    });
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMicrophoneMuted, setIsMicrophoneMuted] = useState(false);
    const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const tokenRef = useRef<EphemeralToken | null>(null);
    const contentTypeRef = useRef<'text' | 'input_text'>('input_text');
    const lastSendRef = useRef<{ role: 'user' | 'assistant' | 'system'; text: string; retried?: boolean } | null>(null);
    const sessionIdRef = useRef<number | null>(null);

    // Обновляем sessionId в ref
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    // Функция для сохранения сообщения в транскрипцию
    const saveMessageToTranscript = useCallback(async (message: ProctoringRealtimeMessage) => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) {
            console.log('No sessionId in ref, skipping transcript save');
            return;
        }

        try {
            console.log('Saving message to transcript:', message);
            await proctoringService.addMessageToTranscript(currentSessionId, {
                type: message.type,
                content: message.content,
                timestamp: message.timestamp,
                isAudio: message.isAudio
            });
            console.log('Message saved to transcript successfully');
        } catch (error) {
            console.error('Error saving message to transcript:', error);
        }
    }, []);

    // Обработка событий от Realtime API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRealtimeEvent = useCallback((event: { type: string;[key: string]: any }) => {
        console.log('Realtime event:', event);

        switch (event.type) {
            case 'conversation.item.created':
                if (event.item.type === 'message') {
                    const message: ProctoringRealtimeMessage = {
                        id: event.item.id,
                        type: event.item.role === 'user' ? 'user' : 'assistant',
                        content: event.item.content?.[0]?.text || event.item.content?.[0]?.transcript || '[Аудио сообщение]',
                        timestamp: new Date(),
                        isAudio: event.item.content?.[0]?.type === 'input_audio'
                    };

                    setMessages(prev => [...prev, message]);
                    saveMessageToTranscript(message);
                }
                break;

            case 'response.audio_transcript.delta':
                // Обновление транскрипции аудио-ответа
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                        const updatedMessage = { ...lastMessage, content: lastMessage.content + event.delta };
                        // Не сохраняем промежуточные delta
                        return [
                            ...prev.slice(0, -1),
                            updatedMessage
                        ];
                    } else {
                        const newMessage = {
                            id: `assistant-${Date.now()}`,
                            type: 'assistant' as const,
                            content: event.delta,
                            timestamp: new Date(),
                            isAudio: true
                        };
                        // Не сохраняем промежуточные delta
                        return [
                            ...prev,
                            newMessage
                        ];
                    }
                });
                break;

            case 'response.text.delta':
                // Обновление текстового ответа
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant' && !lastMessage.isAudio) {
                        const updatedMessage = { ...lastMessage, content: lastMessage.content + event.delta };
                        // Не сохраняем промежуточные delta
                        return [
                            ...prev.slice(0, -1),
                            updatedMessage
                        ];
                    } else {
                        const newMessage = {
                            id: `assistant-text-${Date.now()}`,
                            type: 'assistant' as const,
                            content: event.delta,
                            timestamp: new Date()
                        };
                        // Не сохраняем промежуточные delta
                        return [
                            ...prev,
                            newMessage
                        ];
                    }
                });
                break;

            case 'response.done':
                // Ответ завершен - сохраняем финальное сообщение ассистента
                console.log('Response completed, saving assistant message');
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                        console.log('Saving completed assistant message:', lastMessage);
                        saveMessageToTranscript(lastMessage);
                    }
                    return prev;
                });
                break;

            case 'response.audio.done':
                // Аудио ответ завершен - сохраняем финальное сообщение ассистента
                console.log('Audio response completed, saving assistant message');
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                        console.log('Saving completed audio assistant message:', lastMessage);
                        saveMessageToTranscript(lastMessage);
                    }
                    return prev;
                });
                setIsPlaying(false);
                break;

            case 'response.audio.start':
                console.log('AI started speaking');
                setIsPlaying(true);
                break;

            case 'response.audio.delta':
                // Аудио данные приходят через WebRTC, но мы можем обновлять состояние
                console.log('Receiving audio data from AI');
                setIsPlaying(true);
                break;

            case 'conversation.item.input_audio_transcription.delta':
                // Обработка транскрипции входного аудио (режим транскрипции)
                console.log('Received user transcription delta:', event.delta, 'sessionId:', sessionId);
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.type === 'user' && lastMessage.isAudio) {
                        const updatedMessage = { ...lastMessage, content: lastMessage.content + event.delta };
                        // Не сохраняем промежуточные delta, только финальную транскрибацию
                        // saveMessageToTranscript(updatedMessage);
                        return [
                            ...prev.slice(0, -1),
                            updatedMessage
                        ];
                    } else {
                        const newMessage = {
                            id: `user-transcript-${Date.now()}`,
                            type: 'user' as const,
                            content: event.delta,
                            timestamp: new Date(),
                            isAudio: true
                        };
                        // Не сохраняем промежуточные delta
                        // saveMessageToTranscript(newMessage);
                        return [
                            ...prev,
                            newMessage
                        ];
                    }
                });
                break;

            case 'conversation.item.input_audio_transcription.completed':
                // Завершенная транскрипция входного аудио
                console.log('User transcription completed - FULL EVENT:', JSON.stringify(event, null, 2));
                console.log('Transcript value:', event.transcript);
                console.log('Current messages state:', messages);

                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    console.log('Last message before completion:', lastMessage);

                    if (lastMessage && lastMessage.type === 'user' && lastMessage.isAudio) {
                        // Используем текст, который уже накоплен в messages от delta событий
                        const finalTranscript = lastMessage.content;
                        console.log('Final transcript from messages:', finalTranscript);

                        if (!finalTranscript || finalTranscript === '[Аудио сообщение]') {
                            console.warn('No valid transcript found in messages');
                            return prev;
                        }

                        const updatedMessage = {
                            ...lastMessage,
                            content: finalTranscript,
                            isAudio: false // Помечаем как транскрибированное
                        };
                        console.log('Saving completed message:', updatedMessage);
                        saveMessageToTranscript(updatedMessage);
                        return [
                            ...prev.slice(0, -1),
                            updatedMessage
                        ];
                    } else {
                        console.warn('No matching audio message found to complete');
                        return prev;
                    }
                });
                break;

            case 'error':
                console.error('Realtime API error:', event.error);
                setConnectionState({ status: 'error', error: event.error?.message || 'Unknown error' });
                break;
        }
    }, [saveMessageToTranscript, sessionId, messages]);

    // Инициализация WebRTC соединения
    const connect = useCallback(async (overrideSessionId?: number) => {
        const currentSessionId = overrideSessionId || sessionId;
        console.log('Connecting with sessionId:', currentSessionId);
        if (connectionState.status === 'connecting' || connectionState.status === 'connected') {
            return;
        }

        try {
            setConnectionState({ status: 'connecting' });

            // Получаем ephemeral token
            const token = await aiChatService.getEphemeralToken();
            tokenRef.current = token;

            // Создаем RTCPeerConnection
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // Создаем аудио элемент для воспроизведения заранее
            const audioElement = new Audio();
            audioElement.muted = false;
            audioElement.volume = 1.0;
            audioElementRef.current = audioElement;

            // Настраиваем обработчик аудио треков
            pc.addEventListener('track', (event) => {
                console.log('Track event received:', event.track.kind, event.streams.length);
                if (event.track.kind === 'audio') {
                    console.log('Received audio track from AI, stream:', event.streams[0]);
                    if (event.streams[0]) {
                        audioElement.srcObject = event.streams[0];
                        console.log('Audio element srcObject set');

                        // Пытаемся воспроизвести аудио
                        const playAudio = async () => {
                            try {
                                await audioElement.play();
                                console.log('Audio playback started successfully');
                            } catch (error) {
                                console.error('Error playing audio, will retry on user interaction:', error);
                                // Сохраняем функцию для повторной попытки при взаимодействии пользователя
                                const retryPlay = async () => {
                                    try {
                                        await audioElement.play();
                                        console.log('Audio playback started after user interaction');
                                        document.removeEventListener('click', retryPlay);
                                        document.removeEventListener('touchstart', retryPlay);
                                    } catch (retryError) {
                                        console.error('Still cannot play audio:', retryError);
                                    }
                                };

                                // Добавляем обработчики для повторной попытки при взаимодействии
                                document.addEventListener('click', retryPlay, { once: true });
                                document.addEventListener('touchstart', retryPlay, { once: true });
                            }
                        };

                        playAudio();
                    } else {
                        console.error('No stream in audio track event');
                    }
                }
            });

            // Для совместимости со старыми браузерами
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pc.addEventListener('addstream', (event: any) => {
                console.log('Add stream event received');
                audioElement.srcObject = event.stream;
                audioElement.play().catch(console.error);
            });

            // Создаем data channel для отправки событий
            const dc = pc.createDataChannel('oai-events');
            dcRef.current = dc;

            // Настраиваем data channel
            dc.addEventListener('open', () => {
                console.log('Data channel opened - ready for realtime communication');
                setConnectionState({ status: 'connected' });
            });

            dc.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                handleRealtimeEvent(data);
            });

            // Получаем локальный медиа поток
            const localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            localStreamRef.current = localStream;

            // Создаем аудио контекст для обработки
            const audioContext = new AudioContext({ sampleRate: 24000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(localStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.addEventListener('audioprocess', (event) => {
                if (dc.readyState === 'open' && !isMicrophoneMuted) {
                    const inputBuffer = event.inputBuffer;
                    const inputData = inputBuffer.getChannelData(0);

                    // Отправляем аудио данные
                    const audioData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        audioData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                    }

                    dc.send(JSON.stringify({
                        type: 'input_audio_buffer.append',
                        audio: arrayBufferToBase64(audioData.buffer)
                    }));
                }
            });

            source.connect(processor);
            processor.connect(audioContext.destination);

            // Добавляем треки в peer connection
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            // Создаем и отправляем offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sessionConfig = {
                type: 'session.update',
                session: {
                    modalities: ['text', 'audio'],
                    instructions: 'You are an AI tutor helping a student with their homework. Ask questions to assess their understanding and provide helpful explanations. Keep responses clear and encouraging.',
                    voice: 'alloy',
                    input_audio_format: 'pcm16',
                    input_audio_transcription: {
                        model: 'gpt-4o-transcribe',
                        language: 'ru' // Добавляем русский язык для лучшей транскрибации
                    },
                    turn_detection: {
                        type: 'server_vad',
                        threshold: 0.3, // Уменьшаем порог обнаружения речи
                        prefix_padding_ms: 300,
                        silence_duration_ms: 300 // Уменьшаем время молчания для завершения
                    },
                    tools: [],
                    tool_choice: 'none',
                    temperature: 0.8,
                    max_response_output_tokens: 4096
                }
            };

            const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.client_secret.value}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const answerSDP = await response.text();
            await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

            // Отправляем конфигурацию сессии
            setTimeout(() => {
                if (dc.readyState === 'open') {
                    dc.send(JSON.stringify(sessionConfig));
                    console.log('Session config sent');

                    // Отправляем системное сообщение для начала разговора
                    setTimeout(() => {
                        if (dc.readyState === 'open') {
                            const initialMessage = {
                                type: 'conversation.item.create',
                                item: {
                                    type: 'message',
                                    role: 'system',
                                    content: [{ type: 'input_text', text: 'Hello! I am your AI tutor. I will help you with your homework. Please introduce yourself and tell me what subject you are studying today.' }]
                                }
                            };
                            dc.send(JSON.stringify(initialMessage));
                            console.log('Initial system message sent');

                            // Запрашиваем ответ
                            dc.send(JSON.stringify({ type: 'response.create' }));
                            console.log('Response requested');
                        }
                    }, 500);
                }
            }, 100);

        } catch (error) {
            console.error('Error connecting to realtime API:', error);
            setConnectionState({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }, [connectionState.status, isMicrophoneMuted, handleRealtimeEvent, sessionId]);

    // Отключение
    const disconnect = useCallback(() => {
        if (processorRef.current && audioContextRef.current) {
            processorRef.current.disconnect();
            audioContextRef.current.close();
            processorRef.current = null;
            audioContextRef.current = null;
        }

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
        setIsPushToTalkActive(false);
    }, []);

    // Отправка системного сообщения
        const sendSystemMessage = useCallback((message: string) => {
            if (dcRef.current && dcRef.current.readyState === 'open') {
                console.log('Sending system message:', message);
                dcRef.current.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                        type: 'message',
                        role: 'system',
                        content: [{ type: 'input_text', text: message }]
                    }
                }));

                dcRef.current.send(JSON.stringify({
                    type: 'response.create'
                }));

                const systemMessage: ProctoringRealtimeMessage = {
                    id: `system-${Date.now()}`,
                    type: 'system',
                    content: message,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, systemMessage]);
                saveMessageToTranscript(systemMessage);
            } else {
                console.error('Cannot send system message: data channel not ready');
            }
        }, [saveMessageToTranscript]);    // Переключение push-to-talk
    const togglePushToTalk = useCallback(() => {
        if (dcRef.current && dcRef.current.readyState === 'open') {
            if (isPushToTalkActive) {
                dcRef.current.send(JSON.stringify({
                    type: 'input_audio_buffer.commit'
                }));
                dcRef.current.send(JSON.stringify({
                    type: 'response.create'
                }));
            }
            setIsPushToTalkActive(!isPushToTalkActive);
        }
    }, [isPushToTalkActive]);

    // Переключение mute для микрофона
    const toggleMicrophoneMute = useCallback(() => {
        setIsMicrophoneMuted(prev => !prev);
    }, []);

    // Переключение mute для аудио
    const toggleMute = useCallback(() => {
        if (audioElementRef.current) {
            const newMuted = !isMuted;
            audioElementRef.current.muted = newMuted;
            setIsMuted(newMuted);
            console.log('Audio muted:', newMuted);
        }
    }, [isMuted]);

    // Очистка сообщений
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Ручной запуск воспроизведения аудио (для случаев, когда autoplay заблокирован)
    const startAudioPlayback = useCallback(async () => {
        if (audioElementRef.current) {
            try {
                await audioElementRef.current.play();
                console.log('Audio playback started manually');
            } catch (error) {
                console.error('Cannot start audio playback:', error);
            }
        }
    }, []);

    return {
        messages,
        connectionState,
        isRecording,
        isPushToTalkActive,
        connect,
        disconnect,
        togglePushToTalk,
        clearMessages,
        isMuted,
        toggleMute,
        isMicrophoneMuted,
        toggleMicrophoneMute,
        sendSystemMessage,
        startAudioPlayback,
    };

    // Вспомогательная функция для конвертации ArrayBuffer в base64
    function arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
