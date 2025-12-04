/**
 * HLS Video Player Component
 * Supports adaptive bitrate streaming with quality selection
 * Uses hls.js for HLS playback in browsers
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoPlayerHLSProps {
  videoId: string;
  streamUrl?: string; // Master playlist URL (if pre-fetched)
  titulo: string;
  onProgress?: (segundos: number, percentual: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function VideoPlayerHLS({
  videoId,
  streamUrl,
  titulo,
  onProgress,
  onComplete,
  className = '',
}: VideoPlayerHLSProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [masterPlaylistUrl, setMasterPlaylistUrl] = useState<string | null>(streamUrl || null);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('off');

  // Fetch stream info if not provided
  useEffect(() => {
    if (!streamUrl && videoId) {
      fetchStreamInfo();
      fetchSubtitles();
    }
  }, [videoId, streamUrl]);

  const fetchStreamInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:8083'}/api/videos/${videoId}/stream`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch stream info');
      }

      const data = await response.json();
      setMasterPlaylistUrl(data.master_playlist_url);
      setAvailableQualities(['auto', ...data.qualities]);
    } catch (err: any) {
      setError(err.message || 'Failed to load video');
      setIsLoading(false);
    }
  };

  const fetchSubtitles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:8083'}/api/subtitles/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VIDEO_API_KEY || 'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX'}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubtitles(data.subtitles || []);
      }
    } catch (err) {
      console.warn('Failed to fetch subtitles:', err);
      // Não bloqueia o player se legendas falharem
    }
  };

  // Initialize HLS player
  useEffect(() => {
    if (!masterPlaylistUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(masterPlaylistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setAvailableQualities(['auto', ...data.levels.map((l: any) => `${l.height}p`)]);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error - failed to load video');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error - trying to recover');
              hls.recoverMediaError();
              break;
            default:
              setError('Fatal error - cannot play video');
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    }
    // HLS.js is not supported on iOS Safari (uses native HLS)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = masterPlaylistUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
      });
    } else {
      setError('HLS not supported in this browser');
      setIsLoading(false);
    }
  }, [masterPlaylistUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      if (duration > 0) {
        const percentual = (video.currentTime / duration) * 100;
        onProgress?.(Math.floor(video.currentTime), percentual);

        // Mark as complete at 90%
        if (percentual >= 90 && !video.ended) {
          onComplete?.();
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      onComplete?.();
      setIsPlaying(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [duration, onProgress, onComplete]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const changeQuality = (quality: string) => {
    if (!hlsRef.current) return;

    setCurrentQuality(quality);

    if (quality === 'auto') {
      hlsRef.current.currentLevel = -1; // Auto quality
    } else {
      const qualityIndex = hlsRef.current.levels.findIndex(
        (level: any) => `${level.height}p` === quality
      );
      if (qualityIndex !== -1) {
        hlsRef.current.currentLevel = qualityIndex;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changeSubtitle = (language: string) => {
    setCurrentSubtitle(language);

    if (!videoRef.current) return;

    const tracks = videoRef.current.textTracks;

    // Desabilitar todas as legendas
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }

    // Habilitar a legenda selecionada
    if (language !== 'off') {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].language === language) {
          tracks[i].mode = 'showing';
          break;
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <Card className={`flex items-center justify-center aspect-video bg-black ${className}`}>
        <div className="text-center text-white">
          <p className="text-red-400 mb-2">❌ {error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className={`relative overflow-hidden bg-black group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
      >
        {/* Subtitle Tracks */}
        {subtitles.map((subtitle) => (
          <track
            key={subtitle.language}
            kind="subtitles"
            src={subtitle.subtitle_url}
            srcLang={subtitle.language}
            label={subtitle.language_label}
            default={subtitle.language === 'pt-BR'}
          />
        ))}
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Play Overlay when paused */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button
            size="lg"
            variant="outline"
            className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
            onClick={togglePlay}
          >
            <Play className="h-10 w-10 text-white fill-white" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pt-6 pb-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/80 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between px-4 pb-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="text-white text-sm ml-2">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <span className="text-xs">{playbackRate}x</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={playbackRate === rate ? 'bg-primary/10' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quality */}
            {availableQualities.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    title="Qualidade"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableQualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality}
                      onClick={() => changeQuality(quality)}
                      className={currentQuality === quality ? 'bg-primary/10' : ''}
                    >
                      {quality === 'auto' ? 'Automático' : quality}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Subtitles (CC) */}
            {subtitles.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-white hover:bg-white/10 ${
                      currentSubtitle !== 'off' ? 'bg-white/20' : ''
                    }`}
                    title="Legendas"
                  >
                    <Subtitles className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => changeSubtitle('off')}
                    className={currentSubtitle === 'off' ? 'bg-primary/10' : ''}
                  >
                    Desligado
                  </DropdownMenuItem>
                  {subtitles.map((subtitle) => (
                    <DropdownMenuItem
                      key={subtitle.language}
                      onClick={() => changeSubtitle(subtitle.language)}
                      className={currentSubtitle === subtitle.language ? 'bg-primary/10' : ''}
                    >
                      {subtitle.language_label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Fullscreen */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title (when paused or hover) */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{titulo}</h3>
          <p className="text-white/70 text-xs">Streaming HLS adaptativo</p>
        </div>
      )}
    </Card>
  );
}
