import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  width = '100%',
  height = '100%',
  controls = true,
  playing: initialPlaying = false,
  muted: initialMuted = false,
  volume: initialVolume = 0.8,
  onPlay,
  onPause,
  onEnded,
  onProgress
}) => {
  const [playing, setPlaying] = useState(initialPlaying);
  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(initialVolume);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  // Проверяем, можно ли воспроизвести видео
  const canPlay = ReactPlayer.canPlay(url);

  const handlePlayPause = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    if (newPlaying) {
      onPlay?.();
    } else {
      onPause?.();
    }
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
    onProgress?.(state);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    setPlayed(seekTo);
    playerRef.current?.seekTo(seekTo);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  // Если URL не поддерживается, показываем ссылку
  if (!canPlay) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="text-gray-600 mb-4">
            <ExternalLink className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Видео недоступно для встроенного просмотра</p>
            <p className="text-sm text-gray-500 mb-4">Откройте ссылку в новой вкладке для просмотра</p>
          </div>
          <button
            onClick={openInNewTab}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть видео
          </button>
          <div className="mt-4 text-xs text-gray-400 break-all">
            {url}
          </div>
        </div>
      </div>
    );
  }

  // Если произошла ошибка загрузки
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">
            <ExternalLink className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Ошибка загрузки видео</p>
            <p className="text-sm text-gray-500 mb-4">Попробуйте открыть ссылку напрямую</p>
          </div>
          <button
            onClick={openInNewTab}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть видео
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* React Player */}
      <ReactPlayer
        ref={playerRef}
        url={url}
        width={width}
        height={height}
        playing={playing}
        muted={muted}
        volume={volume}
        controls={false} // Всегда используем кастомные контролы
        onReady={() => setReady(true)}
        onError={() => setError(true)}
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onProgress={handleProgress}
        onDuration={setDuration}
        config={{
          youtube: {
            playerVars: { 
              showinfo: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0
            }
          },
          vimeo: {
            playerOptions: { 
              color: 'ffffff',
              controls: false,
              byline: false,
              portrait: false,
              title: false
            }
          },
          file: {
            attributes: {
              controlsList: 'nodownload'
            }
          }
        }}
      />

      {/* Loading State */}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Загрузка видео...</p>
          </div>
        </div>
      )}

      {/* Simple Controls */}
      {ready && controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={played}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="flex items-center justify-center w-8 h-8 hover:bg-white/20 rounded transition-colors"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Time Display */}
              <div className="text-sm">
                {formatTime(played * duration)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={openInNewTab}
                className="flex items-center justify-center w-8 h-8 hover:bg-white/20 rounded transition-colors"
                title="Открыть в новой вкладке"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
