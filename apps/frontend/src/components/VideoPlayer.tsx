import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

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
  const [fullscreen, setFullscreen] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    if (newPlaying) {
      onPlay?.();
    } else {
      onPause?.();
    }
  };

  const handleMute = () => {
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
    onProgress?.(state);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle = fullscreen 
    ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' 
    : 'relative w-full';

  return (
    <div className={containerStyle}>
      <div className="relative w-full h-full">
        {/* React Player */}
        <ReactPlayer
          url={url}
          width={width}
          height={height}
          playing={playing}
          muted={muted}
          volume={volume}
          controls={!controls} // Используем встроенные контролы если кастомные отключены
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
                showinfo: 1,
                controls: controls ? 0 : 1 
              }
            },
            vimeo: {
              playerOptions: { 
                color: 'ffffff',
                controls: !controls
              }
            }
          }}
        />

        {/* Custom Controls */}
        {controls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={played}
                onChange={(e) => setPlayed(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${played * 100}%, #6b7280 ${played * 100}%, #6b7280 100%)`
                }}
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

                {/* Volume Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMute}
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
                    onChange={handleVolumeChange}
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
                  onClick={() => setFullscreen(!fullscreen)}
                  className="flex items-center justify-center w-8 h-8 hover:bg-white/20 rounded transition-colors"
                >
                  {fullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {url && !ReactPlayer.canPlay(url) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Загрузка видео...</p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Exit */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 text-white bg-black/50 rounded p-2 hover:bg-black/70 transition-colors z-10"
        >
          <Minimize className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
