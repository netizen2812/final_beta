import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, Shield } from 'lucide-react';
import { getNumericUid } from '../utils/tarbiyahUtils';

interface AgoraVideoPaneProps {
  appId: string;
  token: string;
  channel: string;
  uid: string | number;
  role: 'scholar' | 'student';
  userName?: string;
  layout?: 'grid' | 'spotlight' | 'inset'; // NEW: Flexible layout control
  scholarId?: string; // Optional identifier to uniquely isolate the scholar
}

const AgoraVideoPane: React.FC<AgoraVideoPaneProps> = ({
  appId,
  token,
  channel,
  uid,
  role,
  userName = 'User',
  layout = 'grid',
  scholarId
}) => {
  const [joined, setJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(role === 'scholar');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<{ video?: ICameraVideoTrack; audio?: IMicrophoneAudioTrack }>({});

  useEffect(() => {
    const init = async () => {
      if (!appId || !token || !channel) return;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Event Listeners
      client.on('user-published', async (user, mediaType) => {
        // DEFENSIVE: Never subscribe to or add self to remote users
        if (String(user.uid) === String(uid)) return;

        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        await client.join(appId, channel, token, uid);
        
        // Create Local Tracks with tiered resolution based on role
        // Higher resolution for Scholar (480p), Lower for Students (240p) to optimize performance
        // Downgrading from 720p to prevent lag in large classrooms
        const videoProfile = role === 'scholar' ? '480p_1' : '240p_1';
        
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true },
          { encoderConfig: videoProfile }
        );

        tracksRef.current = { video: videoTrack, audio: audioTrack };
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        if (role === 'scholar') {
            await client.publish([audioTrack, videoTrack]);
            setMicEnabled(true);
            setVideoEnabled(true);
        } else {
            audioTrack.setEnabled(false);
            await client.publish([audioTrack, videoTrack]);
            setMicEnabled(false);
            setVideoEnabled(true);
        }

        setJoined(true);
      } catch (error) {
        console.error('Agora join failed:', error);
      }
    };

    init();

    return () => {
      tracksRef.current.audio?.close();
      tracksRef.current.video?.close();
      clientRef.current?.unpublish();
      clientRef.current?.leave();
      clientRef.current = null;
    };
  }, [appId, token, channel, uid, role]);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoRef.current.innerHTML = ''; // Clear container to prevent duplicate video elements
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  // Reliable scholar identification using exact clerk user ID (hashed to match Agora UID).
  const scholarUser = role === 'student' 
    ? remoteUsers.find(u => {
        const numericScholarId = scholarId ? getNumericUid(scholarId) : null;
        return numericScholarId && String(u.uid) === String(numericScholarId);
      }) 
    : null;

  return (
    <div className={`relative w-full h-full bg-[#0a0a0a] overflow-hidden transition-all duration-700 shadow-2xl group ${layout === 'inset' ? 'rounded-2xl border border-white/10' : 'rounded-[2rem] border border-white/5'}`}>
      
      {/* INITIAL LOADING OVERLAY */}
      {!joined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl z-40">
           <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4" />
        </div>
      )}

      {/* VIDEO STAGE */}
      <div className={`w-full h-full p-2 transition-all duration-700 ${
        layout === 'grid' 
          ? (() => {
              const count = remoteUsers.length;
              if (count === 0) return 'flex items-center justify-center';
              if (count === 1) return 'grid grid-cols-1 max-w-3xl mx-auto items-center content-center h-full';
              if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 items-center content-center h-full gap-4 max-w-5xl mx-auto';
              if (count <= 4) return 'grid grid-cols-2 grid-rows-2 items-center content-center h-full gap-4';
              if (count <= 6) return 'grid grid-cols-2 md:grid-cols-3 grid-rows-2 items-center content-center h-full gap-3 md:gap-4';
              if (count <= 9) return 'grid grid-cols-2 md:grid-cols-3 grid-rows-3 items-center content-center h-full gap-3';
              return 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto content-start';
            })()
          : 'flex items-center justify-center'
      }`}>
        
        {/* LOCAL PREVIEW */}

        <div 
          ref={localVideoRef}
          className={`group bg-[#111] border border-white/5 shadow-2xl transition-all duration-500 z-50 ${layout === 'inset'
            ? 'hidden' // Hide self preview in inset mode for recitation focus
            : role === 'scholar' 
              ? 'absolute bottom-6 right-6 w-32 md:w-48 aspect-video rounded-3xl hover:scale-105 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-emerald-500/20' // Float scholar out of the grid
              : layout === 'grid'
                ? 'relative aspect-video rounded-2xl border-emerald-500/20' 
                : 'absolute bottom-4 right-4 w-32 md:w-48 aspect-video rounded-2xl z-20 hover:scale-105'
          }`}
        >
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 z-10 border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${localAudioTrack?.enabled ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[9px] text-white/90 uppercase tracking-widest font-black">You</span>
          </div>
        </div>

        {/* REMOTE STREAMS (GRID) */}
        {layout === 'grid' && remoteUsers.map((user) => (
          <RemoteStream key={user.uid} user={user} label={`Student ${user.uid.toString().slice(-4)}`} />
        ))}

        {/* REMOTE STREAMS (SPOTLIGHT/INSET) */}
        {layout !== 'grid' && scholarUser && (
           <RemoteStream user={scholarUser} label="Scholar" isMain />
        )}

        {/* WAITING FOR SCHOLAR (Student) */}
        {layout !== 'grid' && !scholarUser && (joined) && (
           <div className="flex flex-col items-center justify-center text-center max-w-sm space-y-4">
              <Shield size={32} className="text-emerald-500/30 animate-pulse" />
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Waiting for Audio/Video</p>
           </div>
        )}
      </div>

      {/* FLOATING CONTROL BAR (Always visible if joined for touch devices) */}
      {joined && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-full flex items-center gap-3 transition-all duration-500 shadow-2xl z-50">
            <ControlToggle 
                active={micEnabled} 
                iconOn={<Mic size={18} />} 
                iconOff={<MicOff size={18} />} 
                onClick={() => {
                    if (localAudioTrack) {
                        const next = !micEnabled;
                        localAudioTrack.setEnabled(next);
                        setMicEnabled(next);
                    }
                }}
            />
            <ControlToggle 
                active={videoEnabled} 
                iconOn={<Video size={18} />} 
                iconOff={<VideoOff size={18} />} 
                onClick={() => {
                    if (localVideoTrack) {
                        const next = !videoEnabled;
                        localVideoTrack.setEnabled(next);
                        setVideoEnabled(next);
                    }
                }}
            />
        </div>
      )}
    </div>
  );
};

const RemoteStream: React.FC<{ user: IAgoraRTCRemoteUser; label: string; isMain?: boolean }> = ({ user, label, isMain }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && containerRef.current) {
      containerRef.current.innerHTML = ''; // Prevent duplicate remote video instances
      user.videoTrack.play(containerRef.current);
    }
  }, [user.videoTrack]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#0d0d0d] border border-white/5 overflow-hidden transition-all duration-700 w-full h-full ${isMain 
        ? 'rounded-[1.5rem]' 
        : 'aspect-video rounded-2xl hover:border-white/20'
      }`}
    >
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-xl rounded-lg flex items-center gap-2 z-10 border border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] text-white font-black uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
};

const ControlToggle: React.FC<{ active: boolean; iconOn: React.ReactNode; iconOff: React.ReactNode; onClick: () => void }> = ({ active, iconOn, iconOff, onClick }) => (
    <button 
        onClick={onClick}
        className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 ${active 
            ? 'bg-white/10 text-white hover:bg-emerald-500/20 hover:text-emerald-400' 
            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
        }`}
    >
        {active ? iconOn : iconOff}
    </button>
);

export default AgoraVideoPane;
