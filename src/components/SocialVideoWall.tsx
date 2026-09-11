import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, Eye, MessageSquare, Send, Plus, Film, AlertCircle, Sparkles } from 'lucide-react';
import { VideoPost } from '../types';
import { DakshyamDatabase } from '../utils/db';

interface SocialVideoWallProps {
  videos: VideoPost[];
  onVideoUpdated: () => void;
  theme?: 'light' | 'dark';
}

export default function SocialVideoWall({ videos, onVideoUpdated, theme = 'dark' }: SocialVideoWallProps) {
  const isLight = theme === 'light';
  const loggedInUser = DakshyamDatabase.getLoggedInUser();
  
  // States
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [showUpload, setShowUpload] = useState(false);
  
  // Upload States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [videoTechTrack, setVideoTechTrack] = useState('ROBOTICS_DEMO');
  
  // Cloudinary media states
  const [selectedMediaType, setSelectedMediaType] = useState<'video' | 'image'>('video');
  const [mediaFileBase64, setMediaFileBase64] = useState<string>('');
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Handle Likes / Upvotes
  const handleLike = (postId: string) => {
    if (!loggedInUser) {
      alert('🔒 Please sign in to upvote and like other students\' projects.');
      return;
    }

    const allVideos = DakshyamDatabase.getVideos();
    const video = allVideos.find(v => v.id === postId);
    if (video) {
      const alreadyLiked = video.likedByUserIds?.includes(loggedInUser.id) || false;
      if (alreadyLiked) {
        video.likedByUserIds = video.likedByUserIds.filter(id => id !== loggedInUser.id);
        video.likes = Math.max(0, video.likes - 1);
      } else {
        video.likedByUserIds = [...(video.likedByUserIds || []), loggedInUser.id];
        video.likes += 1;
      }
      DakshyamDatabase.saveVideos(allVideos);
      onVideoUpdated();
    }
  };

  // Add Comment
  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInput[postId]?.trim();
    if (!commentText) return;

    if (!loggedInUser) {
      alert('🔒 Please authenticate to leave feedback comments.');
      return;
    }

    const allVideos = DakshyamDatabase.getVideos();
    const video = allVideos.find(v => v.id === postId);
    if (video) {
      if (!video.comments) video.comments = [];
      video.comments.push({
        id: `c-${Date.now()}`,
        senderName: loggedInUser.name,
        text: commentText,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });
      
      // Persist
      DakshyamDatabase.saveVideos(allVideos);
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
      onVideoUpdated();
    }
  };

  // Handle File change with HTML5 video length validation (60 seconds)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorText('');
    setSuccessText('');
    setMediaFileBase64('');
    setMediaFileName('');

    if (selectedMediaType === 'video') {
      if (!file.type.startsWith('video/')) {
        setErrorText('❌ Please select a valid video file.');
        e.target.value = '';
        return;
      }

      // Read duration in browser first
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = URL.createObjectURL(file);
      
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 61) { // 61 sec tolerance for precision
          setErrorText(`❌ Selected video duration is ${Math.round(videoElement.duration)} seconds. Demonstration video must be 60 seconds or less.`);
          e.target.value = '';
          return;
        }

        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaFileBase64(reader.result as string);
          setMediaFileName(file.name);
        };
        reader.readAsDataURL(file);
      };
    } else {
      if (!file.type.startsWith('image/')) {
        setErrorText('❌ Please select a valid image file.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFileBase64(reader.result as string);
        setMediaFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Student Project upload (to Cloudinary proxy)
  const handleUploadProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!title.trim() || !description.trim() || !groupId.trim()) {
      setErrorText('Please select your student team group and enter a valid title/description.');
      return;
    }

    if (!mediaFileBase64) {
      setErrorText('Please select a demonstration video or photo to upload first.');
      return;
    }

    try {
      setIsUploadingMedia(true);
      let finalMediaUrl = mediaFileBase64;
      let isCloudinaryStored = false;

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: mediaFileBase64,
            resourceType: selectedMediaType
          })
        });

        if (res.ok) {
          const data = await res.json();
          finalMediaUrl = data.url;
          isCloudinaryStored = true;
        } else {
          const errData = await res.json();
          console.warn('Cloudinary upload warning:', errData.error);
        }
      } catch (uploadErr: any) {
        console.warn('Cloudinary proxy warning:', uploadErr.message);
      }

      const allVideos = DakshyamDatabase.getVideos();
      const groups = DakshyamDatabase.getGroups();
      const matchGroup = groups.find(g => g.id === groupId);
      
      const newVideo: VideoPost = {
        id: `vid-${Date.now()}`,
        groupId,
        groupName: matchGroup ? matchGroup.name : 'Independent Lab Node',
        title,
        description,
        videoUrl: finalMediaUrl,
        mediaType: selectedMediaType,
        likes: 0,
        likedByUserIds: [],
        views: 1,
        comments: [],
        createdAt: new Date().toISOString().split('T')[0]
      };

      allVideos.unshift(newVideo);
      DakshyamDatabase.saveVideos(allVideos);

      if (isCloudinaryStored) {
        setSuccessText('🚀 Project media successfully uploaded to Cloudinary and registered in MongoDB!');
      } else {
        setSuccessText('🚀 Project media published! (Add CLOUDINARY credentials in settings for external cloud CDN)');
      }

      setTitle('');
      setDescription('');
      setMediaFileBase64('');
      setMediaFileName('');
      
      setTimeout(() => {
        setShowUpload(false);
        setSuccessText('');
        onVideoUpdated();
      }, 1500);

    } catch (err: any) {
      setErrorText(err?.message || 'Media transfer failed. Please make sure Cloudinary environment variables are configured.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Get current student available groups
  const studentGroups = DakshyamDatabase.getGroups().filter(g => {
    if (loggedInUser && loggedInUser.role === 'student') {
      return g.memberIds.includes(loggedInUser.id);
    }
    return true; // trainers/admins can view all groups
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Banner / Header */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 md:p-6 backdrop-blur-md ${
        isLight 
          ? 'border-amber-500/15 bg-gradient-to-r from-amber-50 to-amber-100/40 shadow-sm' 
          : 'border-cyan-500/15 bg-gradient-to-r from-slate-950 to-cyan-950/20'
      }`}>
        <div className={`absolute top-0 right-0 h-full w-48 bg-radial blur-xl pointer-events-none ${
          isLight ? 'from-amber-500/5 to-transparent' : 'from-cyan-500/10 to-transparent'
        }`} />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className={`text-3xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border ${
              isLight 
                ? 'text-amber-800 border-amber-500/20 bg-amber-500/5 font-bold' 
                : 'text-[#22d3ee]/80 bg-cyan-950/40 border-cyan-500/15'
            }`}>
              Live Stream Exhibition
            </span>
            <h2 className={`text-lg md:text-xl font-black tracking-wide flex items-center gap-2 uppercase ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Film className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-cyan-400'}`} /> Student Innovation Wall
            </h2>
            <p className={`text-xs font-sans max-w-lg ${
              isLight ? 'text-slate-650' : 'text-slate-400'
            }`}>
              Explore dynamic video captures uploaded directly by young creators from Balaghat, Waraseoni, & beyond. Upvote excellence!
            </p>
          </div>

          <button
            onClick={() => {
              if (!loggedInUser) {
                alert('🔒 Please register as a student and login to present videos.');
                return;
              }
              setShowUpload(!showUpload);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all self-stretch sm:self-auto justify-center uppercase tracking-wide shadow-sm ${
              isLight 
                ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_4px_12px_rgba(217,119,6,0.15)]' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.22)]'
            }`}
          >
            <Plus className="w-4 h-4" /> Showcase Project Video
          </button>
        </div>
      </div>

      {/* Upload Panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleUploadProject} className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 ${
              isLight ? 'bg-white border-amber-500/15 shadow-md' : 'bg-[#050505]/80 border-cyan-500/15'
            }`}>
              <div className={`flex items-center gap-1.5 text-xs font-mono tracking-wider font-bold ${
                isLight ? 'text-amber-800' : 'text-cyan-400'
              }`}>
                <Sparkles className="w-4 h-4 animate-pulse" /> CONFIGURE NEW VIDEO NODE
              </div>

              {errorText && <div className="text-xs text-red-500 font-mono font-bold">{errorText}</div>}
              {successText && <div className={`text-xs font-mono font-bold ${isLight ? 'text-amber-700' : 'text-cyan-400'}`}>{successText}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-3xs font-mono tracking-wider uppercase mb-1 ${isLight ? 'text-slate-600 font-bold' : 'text-cyan-400'}`}>Select Student Team Group</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  >
                    <option value="">-- Choose Team --</option>
                    {studentGroups.map(gp => (
                      <option key={gp.id} value={gp.id}>{gp.name} ({gp.projectTitle})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-3xs font-mono tracking-wider uppercase mb-1 ${isLight ? 'text-slate-600 font-bold' : 'text-cyan-400'}`}>Media Demonstration Type</label>
                  <select
                    value={selectedMediaType}
                    onChange={(e) => {
                      setSelectedMediaType(e.target.value as 'video' | 'image');
                      setMediaFileBase64('');
                      setMediaFileName('');
                      setErrorText('');
                    }}
                    disabled={isUploadingMedia}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  >
                    <option value="video">Project Video Demonstration (Max 60 Seconds)</option>
                    <option value="image">Project Photo Snapshot Showcase</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-3xs font-mono tracking-wider uppercase mb-1 ${isLight ? 'text-slate-600 font-bold' : 'text-cyan-400'}`}>
                    Select {selectedMediaType === 'video' ? 'Demonstration Video' : 'Photo Snapshot'} (Cloudinary Storage)
                  </label>
                  <input
                    type="file"
                    accept={selectedMediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileChange}
                    disabled={isUploadingMedia}
                    required
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-4xs file:font-semibold ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900 focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  />
                  {mediaFileName && (
                    <div className="mt-1 text-4xs font-mono text-slate-500">
                      ✓ Loaded: {mediaFileName} ({Math.round(mediaFileBase64.length / 1024)} KB)
                    </div>
                  )}
                  {selectedMediaType === 'video' && (
                    <p className={`text-[10px] mt-1 font-mono ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                      ⚠️ Absolute limit: 60 seconds video file. Ensure file is trimmed properly.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-3xs font-mono tracking-wider uppercase mb-1 ${isLight ? 'text-slate-600 font-bold' : 'text-cyan-400'}`}>Project Exhibition Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Ultrasonic Distance Mapping with micro motors"
                    required
                    disabled={isUploadingMedia}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-600 focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-3xs font-mono tracking-wider uppercase mb-1 ${isLight ? 'text-slate-600 font-bold' : 'text-cyan-400'}`}>Description (Tell us what we see)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe variables, code libraries, microcontroller setups, or and performance stats..."
                    rows={2}
                    required
                    disabled={isUploadingMedia}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-600 focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  disabled={isUploadingMedia}
                  className={`text-3xs font-mono uppercase px-4 py-2 rounded-xl cursor-pointer border transition-colors ${
                    isLight 
                      ? 'bg-transparent hover:bg-slate-100 border-slate-300 text-slate-600' 
                      : 'bg-transparent hover:bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMedia}
                  className={`text-3xs font-bold uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5 ${
                    isLight 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-300' 
                      : 'bg-cyan-500 hover:bg-cyan-450 text-slate-950 disabled:bg-cyan-800'
                  }`}
                >
                  {isUploadingMedia ? (
                    <>
                      <span className="w-2.5 h-2.5 border-2 border-t-transparent rounded-full animate-spin border-current" />
                      Uploading to Cloudinary...
                    </>
                  ) : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Videos List */}
      <div className="grid grid-cols-1 gap-6">
        {videos.map(video => {
          const isLiked = loggedInUser && video.likedByUserIds?.includes(loggedInUser.id);
          
          return (
            <div 
              key={video.id}
              className={`border rounded-2xl overflow-hidden backdrop-blur-md relative group transition-all duration-300 ${
                isLight 
                  ? 'bg-white border-slate-200 hover:shadow-md hover:border-amber-500/25' 
                  : 'bg-[#050505]/70 border-cyan-500/10 hover:border-cyan-500/25 shadow-sm'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-5">
                
                 {/* Interactive Video Player & Stream */}
                <div className={`w-full md:w-56 h-36 border rounded-xl relative overflow-hidden flex flex-col items-center justify-center font-mono text-2xs mb-2 md:mb-0 select-none ${
                  isLight ? 'bg-amber-950 border-amber-500/15' : 'bg-[#000] border-cyan-500/10'
                }`}>
                  {video.videoUrl && (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) ? (
                    video.mediaType === 'image' ? (
                      <img 
                        src={video.videoUrl} 
                        className="w-full h-full object-cover rounded-xl" 
                        alt={video.title} 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <video 
                        src={video.videoUrl} 
                        controls 
                        preload="metadata"
                        className="w-full h-full object-cover rounded-xl bg-black" 
                      />
                    )
                  ) : (
                    <>
                      <div className={`absolute inset-0 pointer-events-none ${
                        isLight ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15),transparent)]' : 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent)]'
                      }`} />
                      
                      {/* Decorative Scanlines */}
                      <div className={`absolute inset-0 bg-gradient-to-b from-transparent bg-[length:100%_4px] pointer-events-none opacity-40 ${
                        isLight ? 'via-amber-500/5' : 'via-cyan-500/5'
                      }`} />

                      {/* Icon depending on metadata */}
                      <div className={`p-3 border rounded-full animate-pulse mb-1.5 ${
                        isLight ? 'bg-amber-900/40 border-amber-400/20 text-amber-300' : 'bg-cyan-950/40 border-cyan-400/20 text-cyan-400'
                      }`}>
                        <Film className="w-5 h-5" />
                      </div>

                      {/* Tech Track Code Name */}
                      <span className={`text-[9px] font-bold tracking-wider font-mono ${
                        isLight ? 'text-amber-350' : 'text-cyan-400'
                      }`}>
                        [{video.videoUrl}]
                      </span>
                      
                      <span className={`text-3xs mt-1 uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        SYSTEM MONITOR: ACTIVE
                      </span>

                      {/* Corner aesthetic markers */}
                      <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-red-500 rounded-full animate-ping" />
                      <div className="absolute bottom-1.5 right-1.5 text-[8px] text-slate-500">
                        HD 1080P
                      </div>
                    </>
                  )}
                </div>

                {/* Content Block */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div className="text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-3xs font-mono uppercase tracking-widest ${
                          isLight ? 'text-amber-800 font-bold' : 'text-[#22d3ee]/85'
                        }`}>
                          Group: {video.groupName}
                        </span>
                        {video.mediaType === 'image' ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                            Photo Snapshot
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                            60s Video Demo
                          </span>
                        )}
                        {video.videoUrl && (video.videoUrl.includes('cloudinary.com') || video.videoUrl.startsWith('http')) && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Cloudinary Stored
                          </span>
                        )}
                      </div>
                      <span className={`text-4xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {video.createdAt}
                      </span>
                    </div>
                    <h3 className={`text-sm md:text-base font-bold tracking-wide font-sans ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {video.title}
                    </h3>
                    <p className={`text-xs font-sans leading-relaxed ${
                      isLight ? 'text-slate-650' : 'text-slate-300'
                    }`}>
                      {video.description}
                    </p>
                  </div>

                  {/* Interaction Buttons */}
                  <div className={`flex flex-wrap items-center gap-4 text-xs font-mono pt-2 border-t ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-cyan-500/5 text-slate-400'
                  }`}>
                    <button
                      onClick={() => handleLike(video.id)}
                      className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                        isLiked 
                          ? (isLight ? 'text-amber-600 font-extrabold scale-105' : 'text-cyan-400 font-bold scale-105') 
                          : (isLight ? 'hover:text-amber-700' : 'hover:text-cyan-300')
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${isLiked ? (isLight ? 'fill-amber-500/20' : 'fill-cyan-500/20') : ''}`} /> 
                      <span>{video.likes} likes</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> 
                      <span>{video.views} views</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> 
                      <span>{video.comments?.length || 0} discussions</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Comments Accordion / Panel */}
              <div className={`p-4 space-y-3.5 border-t ${
                isLight ? 'bg-slate-50/60 border-slate-100' : 'bg-[#050505]/65 border-cyan-500/5'
              }`}>
                <div className={`text-2xs font-mono tracking-wider uppercase ${isLight ? 'text-slate-500 font-bold' : 'text-slate-400'}`}>
                  Comment Thread Response:
                </div>

                {/* Actual saved thread items */}
                <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                  {video.comments && video.comments.length > 0 ? (
                    video.comments.map(c => (
                      <div key={c.id} className={`text-2xs font-sans p-2 rounded-xl text-left space-y-0.5 border ${
                        isLight ? 'bg-white border-slate-100' : 'bg-[#111111]/30 border-slate-500/5'
                      }`}>
                        <div className="flex items-center justify-between font-mono">
                          <span className={`font-semibold ${isLight ? 'text-amber-800' : 'text-cyan-400/90'}`}>{c.senderName}</span>
                          <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{c.timestamp}</span>
                        </div>
                        <p className={`font-light leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className={`text-3xs font-mono text-center italic py-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                      No reviews or questions posted on this project yet. Write the first!
                    </div>
                  )}
                </div>

                {/* Standard Comment Form */}
                <form 
                  onSubmit={(e) => handleAddComment(video.id, e)}
                  className={`flex gap-2 pt-1 border-t ${isLight ? 'border-slate-100' : 'border-cyan-500/5'}`}
                >
                  <input
                    type="text"
                    value={commentInput[video.id] || ''}
                    onChange={(e) => setCommentInput(prev => ({ ...prev, [video.id]: e.target.value }))}
                    placeholder={loggedInUser ? "Join the thread, leave a comment..." : "🔒 Authenticate to join the discussion thread"}
                    disabled={!loggedInUser}
                    className={`flex-1 rounded-xl py-2 px-3 text-2xs focus:outline-none focus:ring-1 disabled:opacity-50 ${
                      isLight 
                        ? 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/10' 
                        : 'bg-[#111]/60 border border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450 focus:ring-cyan-500/20'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!loggedInUser || !commentInput[video.id]?.trim()}
                    className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-30 ${
                      isLight 
                        ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/10 text-amber-700' 
                        : 'bg-[#0f2a2e]/60 border border-cyan-500/20 hover:border-cyan-450 text-cyan-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
