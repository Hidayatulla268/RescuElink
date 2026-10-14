import React, { useState, useEffect, useRef } from 'react';
import { AutoScrambleResult } from '../types';
import { api } from '../services/api';
import { 
  X, Camera, AlertTriangle, Truck, Sparkles, CheckCircle2, 
  MapPin, ShieldAlert, ArrowRight, Zap, Navigation, Upload, 
  RefreshCw, Crosshair, Phone, User, Check
} from 'lucide-react';

interface CitizenSnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoScrambled: (result: AutoScrambleResult) => void;
  onOpenGreenCorridor: () => void;
}

export const CitizenSnapModal: React.FC<CitizenSnapModalProps> = ({
  isOpen,
  onClose,
  onAutoScrambled,
  onOpenGreenCorridor
}) => {
  if (!isOpen) return null;

  const [locationAddress, setLocationAddress] = useState<string>('Silk Board Central Junction, Bengaluru');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 12.9180,
    lng: 77.6240
  });
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Camera & Device states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scrambleResult, setScrambleResult] = useState<AutoScrambleResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when closing modal
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported by this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access unavailable or declined. Please choose a photo from your device.');
      setIsCameraActive(false);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImageSrc(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Real GPS Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4))
        };
        setCoordinates(coords);
        setLocationAddress(`GPS: ${coords.lat}° N, ${coords.lng}° E (Accurate within ${Math.round(pos.coords.accuracy)}m)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve GPS location. Please type the street address.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSnapAndScramble = async () => {
    if (!locationAddress.trim()) {
      alert('Please specify the accident location address or use GPS.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.reportAccidentSnap({
        image_base64: imageSrc || 'data:image/jpeg;base64,scene_photographic_record_pending',
        location_address: locationAddress,
        coordinates: coordinates,
        reporter_name: isAnonymous ? 'Anonymous Good Samaritan' : (reporterName || 'Citizen Bystander'),
        reporter_phone: isAnonymous ? 'Anonymous' : (reporterPhone || '+91 112 Verified Intake'),
        optional_notes: notes || 'Immediate road accident emergency verified via citizen photo intake.'
      });
      setScrambleResult(res);
      onAutoScrambled(res);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(
            `Accident reported. Nearest 108 ambulance ${res.assigned_ambulance_callsign} scrambled. ETA ${res.eta_minutes} minutes.`
          );
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Graceful fallback
        }
      }
    } catch (err) {
      alert(`Accident intake failed: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [isOpen, onClose]);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-card-ultra border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto max-h-[92vh] font-mono animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-neon-red">
              <Camera className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Road Accident Photo SOS — Auto-Scramble 108 Ambulance
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-Time Photographic Incident Intake & Instant Duty Ambulance Mobilization
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/50 transition active:scale-95 shadow-md"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {!scrambleResult ? (
            <>
              {/* Camera / Photo Capture Card */}
              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                  1. Capture Crash Scene Photo (Optical Evidence):
                </span>

                <div className="relative rounded-2xl bg-black/60 border border-white/15 overflow-hidden flex flex-col items-center justify-center min-h-[220px] p-4 text-center">
                  {imageSrc ? (
                    /* Captured Photo Preview */
                    <div className="relative w-full flex flex-col items-center space-y-3">
                      <img 
                        src={imageSrc} 
                        alt="Captured Accident Scene" 
                        className="max-h-56 w-full object-cover rounded-xl border border-emerald-500/40 shadow-lg"
                      />
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Photo Captured & Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageSrc(null)}
                          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] border border-white/15 transition flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retake
                        </button>
                      </div>
                    </div>
                  ) : isCameraActive ? (
                    /* Live Video Stream Viewfinder */
                    <div className="relative w-full flex flex-col items-center space-y-3">
                      <div className="relative w-full rounded-xl overflow-hidden border border-cyan-500/50">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-56 object-cover bg-black"
                        />
                        <div className="absolute inset-4 border border-dashed border-cyan-400/50 rounded-lg pointer-events-none flex items-center justify-center">
                          <Crosshair className="w-8 h-8 text-cyan-400/40 animate-pulse" />
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-cyan-300 font-bold flex items-center gap-1.5 border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          LIVE CAMERA VIEWFINDER
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={capturePhotoFromCamera}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs flex items-center gap-2 shadow-neon-red transition active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Snap Shutter Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs border border-white/15 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Idle State: Shutter / Upload Buttons */
                    <div className="flex flex-col items-center space-y-3 py-4">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-neon-blue">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-sm">Take or Upload Accident Scene Photo</p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Multimodal Vision analyzes vehicle crumple, entrapment, and spills to verify trauma severity and auto-dispatch the nearest free ambulance.
                        </p>
                      </div>

                      {cameraError && (
                        <p className="text-[10px] text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                          {cameraError}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-neon-blue transition active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Start Device Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 font-bold text-xs flex items-center gap-2 transition active:scale-95"
                        >
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>Upload From Gallery</span>
                        </button>

                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Input with Live GPS Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. Crash Scene Location Address</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-[10px] text-cyan-300 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-1 transition active:scale-95"
                  >
                    <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Acquiring GPS...' : '📍 Use Live GPS Location'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. Silk Board Flyover Ramp, Outer Ring Road, Bengaluru"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Reporter Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block font-bold text-[11px] flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Your Name (Good Samaritan)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder={isAnonymous ? 'Protected Anonymous Report' : 'e.g. Vikram Rao'}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-bold text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Mobile Phone Number</span>
                  </label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder={isAnonymous ? 'Unlisted' : '+91 98450 XXXXX'}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="anonymousCheckbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="anonymousCheckbox" className="text-[11px] text-slate-300 select-none cursor-pointer">
                  Protect My Identity (Protected Under Good Samaritan Law - Sec 134A MV Act)
                </label>
              </div>

              {/* Observations & Injury Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold text-[11px]">
                  Scene Observations & Injuries (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe visible injuries, trapped victims, fuel leaks, or vehicle count..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition text-xs"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSnapAndScramble}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-red transition transform active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isSubmitting
                      ? 'Analyzing Scene with Gemini Vision & Scrambling Closest Ambulance...'
                      : 'Transmit Accident SOS & Auto-Scramble 108 Ambulance'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Success & Auto-Scrambled Ambulance Screen */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-neon-green">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Nearest 108 Ambulance Mobilized Instantly
                </h3>
                <p className="text-xs text-emerald-300">
                  Multimodal vision evaluated accident scene • Closest duty vehicle scrambled with zero dispatcher lag!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Assigned 108 Unit:</span>
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    {scrambleResult.assigned_ambulance_callsign}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Estimated Arrival (ETA):</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {scrambleResult.eta_minutes} Minutes
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Current Distance to Scene:</span>
                  <span className="font-bold text-white">
                    {scrambleResult.distance_km} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Calculated Severity Tier:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {scrambleResult.priority} ({scrambleResult.severity_score}/100)
                  </span>
                </div>
              </div>

              {/* Nearest Trauma Receiving Centers */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                  Receiving Trauma Emergency Centers Notified:
                </span>
                <div className="space-y-1.5">
                  {scrambleResult.available_hospitals.slice(0, 2).map((h) => (
                    <div 
                      key={h.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{h.name}</span>
                        <span className="text-[10px] text-slate-400">{h.address}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        {h.trauma_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenGreenCorridor}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-neon-blue transition"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open Green Corridor Tracker</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 font-bold text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
