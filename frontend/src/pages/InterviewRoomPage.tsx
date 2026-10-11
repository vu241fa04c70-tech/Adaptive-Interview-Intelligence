import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Maximize,
  Minimize,
  Camera,
  CameraOff,
  AlertOctagon,
  CheckCircle2,
  MessageSquare,
  Smartphone,
  Users,
  Eye,
  ShieldCheck,
  Zap,
  Pin,
  Layout,
  RotateCcw
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';
import {
  fetchInterviewSession,
  startInterview,
  submitAnswer,
  endInterview,
  sendIntegrityEvent
} from '../services/api';
import type { InterviewSession, AdaptationPipeline } from '../types';
import VoiceWaveform from '../components/VoiceWaveform';
import AiInterviewerAvatar, { type AvatarState } from '../components/AiInterviewerAvatar';
import {
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported
} from '../services/speech';

interface InterviewRoomPageProps {
  sessionId: string;
  onFinishInterview: (sessionId: string) => void;
}

export const InterviewRoomPage: React.FC<InterviewRoomPageProps> = ({
  sessionId,
  onFinishInterview
}) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    question_index: number;
    question_text: string;
    question_type: string;
    target_competency: string;
    difficulty: string;
    reason_for_next_question?: string;
    adaptation_pipeline?: AdaptationPipeline;
  } | null>(null);

  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Integrity & Warnings Monitor State (Max 3 Warnings)
  const [integrityEventsCount, setIntegrityEventsCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const warningCountRef = useRef<number>(0);
  const [lastWarningReason, setLastWarningReason] = useState<string | null>(null);
  const [isTerminatedDueToIntegrity, setIsTerminatedDueToIntegrity] = useState(false);
  const [warningCooldown, setWarningCooldown] = useState(false);
  const warningCooldownRef = useRef<boolean>(false);
  const [terminationCountdown, setTerminationCountdown] = useState<number>(3);
  const terminationTimerRef = useRef<any>(null);

  // Proctor Camera Window Placement (Corner Floating vs Inline Docked)
  const [cameraDockMode, setCameraDockMode] = useState<'corner' | 'inline'>('corner');
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Camera & AI Vision Guard State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [visionStatus, setVisionStatus] = useState<'OK' | 'NO_PERSON' | 'MULTIPLE_PERSONS' | 'PHONE_DETECTED'>('OK');
  const [detectedLabels, setDetectedLabels] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionIntervalRef = useRef<any>(null);

  // AI Object Detection Models (TensorFlow.js COCO-SSD + Google BlazeFace)
  const cocoModelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const blazeFaceModelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Temporal multi-frame confirmation counters (prevents single-frame false positives)
  const consecutivePhoneFramesRef = useRef<number>(0);
  const consecutiveMultiPersonFramesRef = useRef<number>(0);
  const consecutiveNoPersonFramesRef = useRef<number>(0);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Audio & Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  // Drawer & Modal Toggles
  const [showHistory, setShowHistory] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Mandatory Fullscreen Gate State
  const [mustEnableFullscreenModal, setMustEnableFullscreenModal] = useState(true);

  // Audible Warning Alarm Beep
  const playWarningBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context might be restricted
    }
  };

  // Derive Avatar State: speaking | listening | thinking | idle
  const avatarState: AvatarState = submitting
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : isRecording
    ? 'listening'
    : 'idle';

  // Dedicated Auto-Termination Sequence on 3 Warnings
  const handleAutoTermination = (details: string) => {
    setIsTerminatedDueToIntegrity(true);
    setLastWarningReason(details);
    stopCamera();
    stopSpeaking();

    // Call backend to persist completed/terminated status
    endInterview(sessionId).catch(console.error);

    // 3-second live countdown for auto-redirect to evaluation report
    setTerminationCountdown(3);
    if (terminationTimerRef.current) clearInterval(terminationTimerRef.current);

    let remainingSeconds = 3;
    terminationTimerRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setTerminationCountdown(remainingSeconds);
      if (remainingSeconds <= 0) {
        if (terminationTimerRef.current) clearInterval(terminationTimerRef.current);
        onFinishInterview(sessionId);
      }
    }, 1000);
  };

  // Core Integrity Warning Dispatcher (Auto-terminates on 3 warnings)
  const dispatchIntegrityWarning = (eventType: string, details: string, bypassCooldown: boolean = false) => {
    if (isTerminatedDueToIntegrity || mustEnableFullscreenModal) return;
    if (warningCountRef.current >= 3) return;

    // Check cooldown unless bypassed (e.g., demo test buttons)
    if (!bypassCooldown && warningCooldownRef.current) return;

    // Audible alarm beep
    playWarningBeep();

    // Set 1.8s cooldown
    warningCooldownRef.current = true;
    setWarningCooldown(true);
    setTimeout(() => {
      warningCooldownRef.current = false;
      setWarningCooldown(false);
    }, 1800);

    // Synchronous strike counter update (avoids React closure staleness)
    const nextCount = Math.min(3, warningCountRef.current + 1);
    warningCountRef.current = nextCount;
    setWarningCount(nextCount);

    setIntegrityEventsCount((prev) => prev + 1);
    setLastWarningReason(details);

    // Send telemetry to backend asynchronously (fire & forget, don't block UI state!)
    sendIntegrityEvent(sessionId, eventType, details, 0.95).catch(console.error);

    // Immediately trigger auto-termination when 3 warnings are reached
    if (nextCount >= 3) {
      handleAutoTermination(details);
    }
  };

  // Fullscreen Toggle Helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  // Handler to start interview with fullscreen
  const handleStartWithFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed/failed:', err);
    }
    await startCamera();
    setMustEnableFullscreenModal(false);

    if (session?.mode === 'voice' && currentQuestion?.question_text) {
      handlePlayAudio(currentQuestion.question_text);
    }
  };

  // Monitor Fullscreen Change & Exiting Fullscreen Warning
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFS = !!document.fullscreenElement;
      setIsFullscreen(activeFS);

      if (!activeFS && !loading && !mustEnableFullscreenModal && !isTerminatedDueToIntegrity) {
        dispatchIntegrityWarning(
          'FULLSCREEN_EXIT',
          'Candidate exited required Fullscreen mode during active interview.'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [loading, mustEnableFullscreenModal, isTerminatedDueToIntegrity, sessionId]);

  // Monitor Tab Switch & Window Blur (Candidate switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !loading && !mustEnableFullscreenModal && !isTerminatedDueToIntegrity) {
        dispatchIntegrityWarning(
          'TAB_SWITCH',
          'Candidate switched browser tabs.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!loading && !mustEnableFullscreenModal && !isTerminatedDueToIntegrity) {
        dispatchIntegrityWarning(
          'WINDOW_BLUR',
          'Candidate navigated away or switched windows.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [loading, mustEnableFullscreenModal, isTerminatedDueToIntegrity, sessionId, warningCooldown]);

  // Load AI Vision Models: COCO-SSD (Objects/Electronics) + BlazeFace (Dedicated Multi-Face Detector)
  useEffect(() => {
    let isMounted = true;
    async function loadModels() {
      try {
        await tf.ready();
        const [cocoRes, faceRes] = await Promise.allSettled([
          cocoSsd.load({ base: 'lite_mobilenet_v2' }),
          blazeface.load()
        ]);
        if (isMounted) {
          if (cocoRes.status === 'fulfilled') {
            cocoModelRef.current = cocoRes.value;
          }
          if (faceRes.status === 'fulfilled') {
            blazeFaceModelRef.current = faceRes.value;
          }
          setIsModelLoading(false);
        }
      } catch (err) {
        console.warn('AI vision model initialization error:', err);
        if (isMounted) setIsModelLoading(false);
      }
    }
    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Camera initialization
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable. Please enable webcam.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Ensure video element always binds to camera stream when rendered or docked
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, cameraDockMode, isCameraMinimized, mustEnableFullscreenModal]);

  // Manual Trigger for testing/demo (bypasses cooldown so 1, 2, 3 strikes can be tested cleanly)
  const triggerManualVisionWarning = (type: 'PHONE_DETECTED' | 'MULTIPLE_PERSONS' | 'NO_PERSON' | 'TAB_SWITCH') => {
    if (type === 'PHONE_DETECTED') {
      setVisionStatus('PHONE_DETECTED');
      dispatchIntegrityWarning(
        'PHONE_OBJECT_DETECTED',
        'Mobile phone or handheld electronic device detected in camera frame.',
        true
      );
    } else if (type === 'MULTIPLE_PERSONS') {
      setVisionStatus('MULTIPLE_PERSONS');
      dispatchIntegrityWarning(
        'MULTIPLE_PERSONS',
        'Multiple persons detected in camera frame.',
        true
      );
    } else if (type === 'TAB_SWITCH') {
      dispatchIntegrityWarning(
        'TAB_SWITCH',
        'Candidate switched browser tabs or opened secondary window.',
        true
      );
    } else {
      setVisionStatus('NO_PERSON');
      dispatchIntegrityWarning(
        'CAMERA_NO_PERSON',
        'Candidate face absent from camera frame.',
        true
      );
    }
  };

  // Real-time AI Camera Vision Analysis Loop
  useEffect(() => {
    if (!cameraActive || mustEnableFullscreenModal || isTerminatedDueToIntegrity) return;

    visionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      if (video.paused && streamRef.current) {
        video.play().catch(() => {});
      }
      if (video.readyState < 2 || video.videoWidth === 0) return;

      try {
        let phoneInFrame = false;
        let detectedFacesCount = 0;
        let cocoPersonCount = 0;
        const currentLabels: string[] = [];

        // 1. Dedicated Multi-Face Detection (Google BlazeFace)
        if (blazeFaceModelRef.current && video.videoWidth > 0) {
          try {
            const faces = await blazeFaceModelRef.current.estimateFaces(video, false);
            // Count faces with probability threshold >= 0.50 (catches leaning or partial faces)
            const confidentFaces = (faces || []).filter((f: any) => {
              const prob = typeof f.probability === 'number'
                ? f.probability
                : (f.probability?.[0] ?? (Array.isArray(f.probability) ? f.probability[0] : 1));
              return prob >= 0.50;
            });
            detectedFacesCount = confidentFaces.length;
            if (detectedFacesCount > 0) {
              currentLabels.push(`${detectedFacesCount} face${detectedFacesCount > 1 ? 's' : ''}`);
            }
          } catch (faceErr) {
            console.warn('BlazeFace detection error:', faceErr);
          }
        }

        // 2. Machine Learning Object Detection (TensorFlow.js COCO-SSD)
        if (cocoModelRef.current) {
          try {
            const predictions = await cocoModelRef.current.detect(video);
            
            predictions.forEach((p) => {
              const cls = p.class.toLowerCase();
              if (cls !== 'person') {
                currentLabels.push(`${p.class} (${Math.round(p.score * 100)}%)`);
              }
              
              // Reliable smartphone detection: captures 'cell phone', 'remote', and 'telephone'
              if (
                (cls === 'cell phone' || cls === 'remote' || cls === 'telephone') &&
                p.score >= 0.32
              ) {
                phoneInFrame = true;
              }
              
              // Person silhouette detection (sensitive threshold for leaning/partial person)
              if (cls === 'person' && p.score >= 0.30) {
                cocoPersonCount++;
              }
            });
          } catch (modelErr) {
            console.warn('COCO-SSD inference warning:', modelErr);
          }
        }

        // Total people in view: maximum of BlazeFace face count and COCO-SSD person silhouettes
        const totalPeopleCount = Math.max(detectedFacesCount, cocoPersonCount);
        if (totalPeopleCount > 0 && !currentLabels.some((l) => l.includes('face'))) {
          currentLabels.unshift(`${totalPeopleCount} person${totalPeopleCount > 1 ? 's' : ''}`);
        }

        setDetectedLabels(currentLabels);

        // 3. Multi-Frame Confirmation Filter
        // A) Phone Detection Rule: Trigger as soon as phone is held for 2 consecutive cycles (~1.3s)
        if (phoneInFrame) {
          consecutivePhoneFramesRef.current += 1;
          if (consecutivePhoneFramesRef.current >= 2) {
            setVisionStatus('PHONE_DETECTED');
            dispatchIntegrityWarning(
              'PHONE_OBJECT_DETECTED',
              'Mobile phone detected in camera stream.'
            );
          }
        } else {
          consecutivePhoneFramesRef.current = 0;
          if (visionStatus === 'PHONE_DETECTED') {
            setVisionStatus('OK');
          }
        }

        // B) Multiple Persons Rule: Trigger when 2+ faces/persons are detected for 2 consecutive cycles (~1.3s)
        if (totalPeopleCount > 1) {
          consecutiveMultiPersonFramesRef.current += 1;
          if (consecutiveMultiPersonFramesRef.current >= 2) {
            setVisionStatus('MULTIPLE_PERSONS');
            dispatchIntegrityWarning(
              'MULTIPLE_PERSONS',
              `Multiple people detected in camera view (${totalPeopleCount} faces detected). Only the candidate is permitted in the room.`
            );
          }
        } else {
          consecutiveMultiPersonFramesRef.current = 0;
          if (visionStatus === 'MULTIPLE_PERSONS') {
            setVisionStatus('OK');
          }
        }

        // C) Candidate Absence Rule: Must be absent for 4+ consecutive cycles (~2.5s)
        if (totalPeopleCount === 0 && !isModelLoading) {
          consecutiveNoPersonFramesRef.current += 1;
          if (consecutiveNoPersonFramesRef.current >= 4) {
            setVisionStatus('NO_PERSON');
            dispatchIntegrityWarning(
              'CAMERA_NO_PERSON',
              'No candidate face detected in camera stream.'
            );
          }
        } else {
          consecutiveNoPersonFramesRef.current = 0;
          if (visionStatus === 'NO_PERSON') {
            setVisionStatus('OK');
          }
        }

        // Normal state restoration
        if (!phoneInFrame && totalPeopleCount === 1) {
          setVisionStatus('OK');
        }

      } catch (err) {
        console.warn('Vision detection cycle error:', err);
      }
    }, 650);

    return () => {
      if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
    };
  }, [cameraActive, mustEnableFullscreenModal, isTerminatedDueToIntegrity, isModelLoading, warningCooldown, visionStatus]);

  // Cleanup camera and termination countdown on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (terminationTimerRef.current) clearInterval(terminationTimerRef.current);
    };
  }, []);

  // Load session & start Q1
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const sess = await fetchInterviewSession(sessionId);
        setSession(sess);

        if (sess.qa_history && sess.qa_history.length > 0) {
          const lastQa = sess.qa_history[sess.qa_history.length - 1];
          if (!lastQa.candidate_answer) {
            setCurrentQuestion({
              question_index: lastQa.question_index,
              question_text: lastQa.question_text,
              question_type: lastQa.question_type,
              target_competency: lastQa.target_competency || 'General',
              difficulty: lastQa.difficulty,
              reason_for_next_question: lastQa.reason_for_next_question || '',
              adaptation_pipeline: lastQa.adaptation_pipeline
            });
          } else {
            const startRes = await startInterview(sessionId);
            setCurrentQuestion(startRes.first_question);
          }
        } else {
          const startRes = await startInterview(sessionId);
          setCurrentQuestion(startRes.first_question);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to start interview session');
        setLoading(false);
      }
    }

    init();
  }, [sessionId]);

  // Elapsed timer loop
  useEffect(() => {
    if (mustEnableFullscreenModal || isTerminatedDueToIntegrity) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mustEnableFullscreenModal, isTerminatedDueToIntegrity]);

  // Tab Switch / Blur detection (Mandatory warning on tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !loading && !mustEnableFullscreenModal && !isTerminatedDueToIntegrity) {
        dispatchIntegrityWarning(
          'TAB_SWITCH',
          'Candidate switched browser tabs or minimized window during active interview.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!loading && !mustEnableFullscreenModal && !isTerminatedDueToIntegrity) {
        dispatchIntegrityWarning(
          'WINDOW_BLUR',
          'Candidate moved focus away from the active interview window.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [sessionId, loading, mustEnableFullscreenModal, isTerminatedDueToIntegrity, warningCooldown]);

  // Paste event handler
  const handlePasteAnswer = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.length > 40) {
      dispatchIntegrityWarning(
        'PASTE_DETECTED',
        `Pasted external text block (${pastedText.length} characters) into answer box.`
      );
    }
  };

  // Audio Playback
  const handlePlayAudio = (text: string) => {
    setIsSpeaking(true);
    speakText(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Toggle Speech Recognition
  const toggleRecording = () => {
    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Web Speech Recognition is not supported by your browser. Please type your answer below.');
      return;
    }

    setSpeechError(null);
    const rec = createSpeechRecognizer(
      (transcript, isFinal) => {
        setAnswerInput((prev) => (isFinal ? `${prev} ${transcript}`.trim() : prev));
      },
      (err) => {
        setSpeechError(`Speech error: ${err}`);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (rec) {
      recognizerRef.current = rec;
      rec.start();
      setIsRecording(true);
    }
  };

  // Submit candidate answer
  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || submitting || !currentQuestion || isTerminatedDueToIntegrity) return;

    handleStopAudio();
    if (isRecording && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsRecording(false);
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitAnswer(sessionId, answerInput.trim(), 20.0);
      setAnswerInput('');

      // Refresh session state
      const updatedSess = await fetchInterviewSession(sessionId);
      setSession(updatedSess);

      if (res.is_interview_complete) {
        await endInterview(sessionId);
        onFinishInterview(sessionId);
      } else if (res.next_question_text) {
        const nextQ = {
          question_index: res.next_question_index || (currentQuestion.question_index + 1),
          question_text: res.next_question_text,
          question_type: res.next_question_type || 'follow_up',
          target_competency: res.next_target_competency || 'General',
          difficulty: res.next_question_difficulty || 'intermediate',
          reason_for_next_question: res.reason_for_next_question,
          adaptation_pipeline: res.adaptation_pipeline
        };
        setCurrentQuestion(nextQ);

        // Auto-play audio if voice mode is enabled
        if (session?.mode === 'voice') {
          handlePlayAudio(res.next_question_text);
        }
      }

      setSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate response and advance interview.');
      setSubmitting(false);
    }
  };

  // Format timer
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reusable Proctor Camera Card Content
  const renderProctorCameraCard = () => (
    <div
      className={`card-theme p-4 space-y-3.5 border-2 shadow-2xl transition-all duration-300 ${
        visionStatus === 'PHONE_DETECTED' || visionStatus === 'MULTIPLE_PERSONS'
          ? 'border-rose-500 ring-4 ring-rose-500/30'
          : 'border-slate-200/90 dark:border-white/10'
      }`}
    >
      {/* Camera Header with Live Indicators & Mode Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${visionStatus === 'OK' ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${visionStatus === 'OK' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            Candidate Proctor
          </span>
        </div>

        {/* Right Controls: Status Pill + Dock/Float + Minimize */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              visionStatus === 'OK'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : visionStatus === 'PHONE_DETECTED'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 animate-pulse'
                : visionStatus === 'MULTIPLE_PERSONS'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40'
            }`}
          >
            {visionStatus === 'OK' ? (
              <>
                <Eye className="w-3 h-3 text-emerald-500" />
                Verified
              </>
            ) : visionStatus === 'PHONE_DETECTED' ? (
              <>
                <Smartphone className="w-3 h-3 text-rose-500" />
                Phone!
              </>
            ) : visionStatus === 'MULTIPLE_PERSONS' ? (
              <>
                <Users className="w-3 h-3 text-rose-500" />
                Multiple!
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                No Face
              </>
            )}
          </span>

          {/* Toggle Dock / Float */}
          <button
            type="button"
            onClick={() => setCameraDockMode(prev => prev === 'corner' ? 'inline' : 'corner')}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            title={cameraDockMode === 'corner' ? 'Dock into Page Layout' : 'Float in Top-Right Corner'}
          >
            {cameraDockMode === 'corner' ? <Layout className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5 text-blue-500" />}
          </button>

          {/* Toggle Minimize / Expand */}
          <button
            type="button"
            onClick={() => setIsCameraMinimized(prev => !prev)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            title={isCameraMinimized ? 'Expand Self-View' : 'Minimize Self-View'}
          >
            {isCameraMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCameraMinimized && (
        <div className="space-y-3">
          {/* Video Box */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-300 dark:border-slate-800 shadow-inner group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                const vid = e.target as HTMLVideoElement;
                vid.play().catch(() => {});
              }}
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Warning Overlay on Video when Phone or Multi-person is detected */}
            {visionStatus === 'PHONE_DETECTED' && (
              <div className="absolute inset-0 bg-rose-600/35 backdrop-blur-[2px] border-4 border-rose-500 flex flex-col items-center justify-center text-white p-2 text-center animate-pulse z-10">
                <Smartphone className="w-9 h-9 text-white mb-1 animate-bounce" />
                <span className="font-black text-xs uppercase tracking-wider">
                  Mobile Phone Detected!
                </span>
                <span className="text-[10px] text-white/95 font-medium">Please put away all electronic devices</span>
              </div>
            )}

            {visionStatus === 'MULTIPLE_PERSONS' && (
              <div className="absolute inset-0 bg-rose-600/35 backdrop-blur-[2px] border-4 border-rose-500 flex flex-col items-center justify-center text-white p-2 text-center animate-pulse z-10">
                <Users className="w-9 h-9 text-white mb-1 animate-bounce" />
                <span className="font-black text-xs uppercase tracking-wider">
                  Multiple People in Frame!
                </span>
                <span className="text-[10px] text-white/95 font-medium">Only candidate permitted in room</span>
              </div>
            )}

            {visionStatus === 'NO_PERSON' && (
              <div className="absolute inset-0 bg-amber-600/35 backdrop-blur-[2px] border-4 border-amber-500 flex flex-col items-center justify-center text-white p-2 text-center z-10">
                <AlertTriangle className="w-9 h-9 text-white mb-1" />
                <span className="font-black text-xs uppercase tracking-wider">
                  No Face Detected
                </span>
                <span className="text-[10px] text-white/95 font-medium">Please center your face in camera</span>
              </div>
            )}

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-1">
                <CameraOff className="w-6 h-6" />
                <span className="text-xs">Camera Offline</span>
              </div>
            )}

            {/* Real-time detection HUD tag */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 text-[10px] bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-white font-mono">
              <div className="flex items-center justify-between">
                <span>AI Proctor Guard</span>
                <span>{isModelLoading ? 'Loading AI Model...' : 'Active (850ms)'}</span>
              </div>
              {detectedLabels.length > 0 && (
                <div className="text-[9px] text-emerald-300 truncate">
                  Detected: {detectedLabels.join(', ')}
                </div>
              )}
            </div>
          </div>

          {cameraError && (
            <p className="text-[11px] text-rose-500 font-semibold">{cameraError}</p>
          )}

          {/* Real-time Integrity Counter & Rules */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Security Warnings Limit
              </span>
              <span className={warningCount > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}>
                {warningCount} / 3 Used
              </span>
            </div>

            {/* Warning Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  warningCount === 0
                    ? 'w-[5%] bg-emerald-500'
                    : warningCount === 1
                    ? 'w-[33%] bg-amber-500'
                    : warningCount === 2
                    ? 'w-[66%] bg-rose-500'
                    : 'w-[100%] bg-rose-600'
                }`}
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <p>• <strong>Phone detection:</strong> Mobile devices in view flag immediate warnings.</p>
              <p>• <strong>Tab switches:</strong> Exiting test window or blurring screen is tracked.</p>
              <p>• <strong>Auto-termination:</strong> Exceeding 3 warnings locks interview immediately.</p>
            </div>
          </div>

          {/* Quick Simulation Triggers for Hackathon Demonstration */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Proctor Demo Triggers:</span>
              {warningCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    warningCountRef.current = 0;
                    setWarningCount(0);
                    warningCooldownRef.current = false;
                    setWarningCooldown(false);
                    setLastWarningReason(null);
                    setVisionStatus('OK');
                    setIsTerminatedDueToIntegrity(false);
                    consecutivePhoneFramesRef.current = 0;
                    consecutiveMultiPersonFramesRef.current = 0;
                    consecutiveNoPersonFramesRef.current = 0;
                    if (terminationTimerRef.current) clearInterval(terminationTimerRef.current);
                  }}
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1 normal-case font-semibold"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => triggerManualVisionWarning('PHONE_DETECTED')}
                className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Smartphone className="w-3 h-3" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => triggerManualVisionWarning('MULTIPLE_PERSONS')}
                className="px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Users className="w-3 h-3" />
                2-Person
              </button>
              <button
                type="button"
                onClick={() => triggerManualVisionWarning('TAB_SWITCH')}
                className="px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Tab Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
          Initializing Proctored AI Interview Room...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col space-y-4 max-w-7xl mx-auto px-4 lg:px-8 py-4">
      
      {/* Hidden canvas for client-side frame sampling */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. MANDATORY FULLSCREEN GATE MODAL */}
      {mustEnableFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-theme border-2 border-blue-500/30 max-w-lg w-full p-6 sm:p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
              <Maximize className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Proctored Interview Setup
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                To guarantee academic and recruiting integrity, this assessment requires Fullscreen mode and camera access.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/10 text-left text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fullscreen mode is enforced. Tab switches trigger warnings.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Camera monitors candidate presence and detects mobile phones or extra persons.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><strong>Strict limit:</strong> 3 integrity warnings automatically terminate and lock the interview.</span>
              </div>
            </div>

            <button
              onClick={handleStartWithFullscreen}
              className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Maximize className="w-4 h-4" />
              Enable Fullscreen & Start Interview
            </button>
          </div>
        </div>
      )}

      {/* 2. THREE WARNINGS TERMINATION MODAL */}
      {isTerminatedDueToIntegrity && (
        <div className="fixed inset-0 z-50 bg-rose-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 max-w-lg w-full p-6 sm:p-8 text-center space-y-6 rounded-2xl shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center border-2 border-rose-500/20 shadow-inner">
              <AlertOctagon className="w-12 h-12 animate-bounce" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-300 dark:border-rose-800">
                <span>⛔ 3 / 3 Integrity Warnings Reached</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Interview Session Terminated
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                Candidate has accumulated the maximum limit of <strong>3 integrity policy violations</strong>. The active interview session has been permanently locked and flagged for recruiter verification.
              </p>

              {lastWarningReason && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 text-left font-semibold">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">Final Violation Trigger:</span>
                  {lastWarningReason}
                </div>
              )}
            </div>

            {/* Countdown Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span className="font-medium">Redirecting to Final Audit Report in:</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-xl font-mono px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                {terminationCountdown}s
              </span>
            </div>

            <button
              onClick={() => {
                if (terminationTimerRef.current) clearInterval(terminationTimerRef.current);
                onFinishInterview(sessionId);
              }}
              className="btn-primary bg-rose-600 hover:bg-rose-700 w-full py-4 text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <span>View Proctored Evaluation Report Now</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. PROCTORED TOP BAR */}
      <div className="card-theme p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Left: Role Info & Mode */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {session?.job_title || session?.role}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-white/10">
                {session?.target_difficulty}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Candidate: {session?.candidate_name} • {session?.mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
            </span>
          </div>
        </div>

        {/* Center: Timer & Warning Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div
            title={`Total integrity violations: ${warningCount}/3. Events logged: ${integrityEventsCount}`}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              warningCount === 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : warningCount === 1
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{warningCount}/3 Warnings</span>
          </div>
        </div>

        {/* Right: Fullscreen & End Interview */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit FS' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => setShowEndConfirm(true)}
            className="btn-secondary text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-1.5 text-xs font-bold"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Submission or Loading Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning Alert Banner (if warning occurred) */}
      {lastWarningReason && !isTerminatedDueToIntegrity && (
        <div className={`p-4 rounded-xl border-2 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn shadow-sm ${
          warningCount === 1
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
            : warningCount === 2
            ? 'bg-rose-500/15 border-rose-500/60 text-rose-900 dark:text-rose-200 animate-pulse'
            : 'bg-rose-600/25 border-rose-600 text-rose-950 dark:text-rose-100'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${warningCount >= 2 ? 'text-rose-600 animate-bounce' : 'text-amber-600'}`} />
            <div>
              <span className={`uppercase tracking-wider font-black block text-[11px] mb-0.5 ${
                warningCount >= 2 ? 'text-rose-700 dark:text-rose-400' : 'text-amber-800 dark:text-amber-400'
              }`}>
                {warningCount === 1 && '⚠️ Integrity Warning 1 of 3 (2 warnings remaining)'}
                {warningCount === 2 && '⚠️ Integrity Warning 2 of 3 — FINAL WARNING BEFORE IMMEDIATE TERMINATION!'}
                {warningCount >= 3 && '⛔ Integrity Warning 3 of 3 — MAXIMUM LIMIT REACHED (TERMINATING)'}
              </span>
              <span className="font-semibold">{lastWarningReason}</span>
            </div>
          </div>
          <button
            onClick={() => setLastWarningReason(null)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs underline font-bold px-2 py-1 shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* 4. PINNED TOP-RIGHT CORNER PROCTOR CAMERA (ALWAYS VISIBLE IN TOP-RIGHT) */}
      {cameraDockMode === 'corner' && (
        <div className="fixed top-20 right-4 sm:right-6 z-40 w-72 sm:w-80 transition-all duration-300 animate-fadeIn">
          {renderProctorCameraCard()}
        </div>
      )}

      {/* 5. MAIN INTERVIEW WORKSPACE LAYOUT */}
      <div
        className={`grid grid-cols-1 ${
          cameraDockMode === 'corner'
            ? 'lg:pr-[330px] xl:pr-[350px]'
            : 'lg:grid-cols-12'
        } gap-6 items-start`}
      >
        {/* LEFT / CENTER COLUMN: AI Interviewer, Question, Response Area */}
        <div className={`${cameraDockMode === 'corner' ? 'w-full' : 'lg:col-span-7'} space-y-4`}>
          
          {/* AI Interviewer Avatar Card */}
          <div className="card-theme p-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Adaptive AI Interviewer
              </span>

              {/* Sound Audio Toggle */}
              {currentQuestion && (
                <button
                  onClick={() =>
                    isSpeaking ? handleStopAudio() : handlePlayAudio(currentQuestion.question_text)
                  }
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  title={isSpeaking ? 'Mute Question' : 'Read Question Aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-violet-600" />}
                </button>
              )}
            </div>

            {/* AI Avatar Component with animated state */}
            <AiInterviewerAvatar
              state={avatarState}
              isAudioPlaying={isSpeaking}
              voiceMode={session?.mode === 'voice'}
            />
          </div>

          {/* Current Question Display Card */}
          <div className="card-theme p-6 space-y-3.5 border-l-4 border-l-violet-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                Question {currentQuestion?.question_index || 1}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Target: <strong>{currentQuestion?.target_competency || 'Core Competency'}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion?.question_text || 'Preparing dynamic question...'}
            </h3>

            {/* Resume / Adaptive Grounding Badge */}
            {currentQuestion?.reason_for_next_question && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                🎯 <strong>Adaptive Context:</strong> {currentQuestion.reason_for_next_question}
              </div>
            )}
          </div>

          {/* Candidate Response Card */}
          <div className="card-theme p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Your Technical Reasoning
                </h3>
              </div>

              {/* Live Waveform Indicator */}
              <VoiceWaveform isActive={isRecording} label={isRecording ? 'Listening...' : undefined} color="emerald" />
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onPaste={handlePasteAnswer}
                rows={7}
                placeholder={
                  session?.mode === 'voice'
                    ? "Click the microphone button to speak, or type your response here..."
                    : "Type your detailed technical explanation here. Mention architecture, edge cases, and tradeoffs..."
                }
                className="input-theme leading-relaxed resize-none text-sm"
                disabled={submitting || isTerminatedDueToIntegrity}
              />
            </div>

            {speechError && (
              <p className="text-xs text-rose-500 font-semibold">{speechError}</p>
            )}

            {/* Bottom Controls Row: Mic Toggle & Submit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={submitting || isTerminatedDueToIntegrity}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                      : 'btn-secondary text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                  <span>{isRecording ? 'Stop Recording' : 'Speak Answer'}</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  {answerInput.length} chars
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerInput.trim() || isTerminatedDueToIntegrity}
                className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Evaluating Reasoning...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Conversation Transcript Accordion */}
          <div className="card-theme p-5 space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Interview History Transcript ({session?.qa_history?.length || 0} Questions Answered)
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/10 max-h-80 overflow-y-auto">
                {session?.qa_history?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No previous answers yet.</p>
                ) : (
                  session?.qa_history.map((qa, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-violet-600 dark:text-violet-400">Q{qa.question_index}: {qa.target_competency}</span>
                        <span className="text-slate-500 font-normal">Score: {qa.score?.toFixed(1) || 0}/4.0</span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{qa.question_text}</p>
                      {qa.candidate_answer && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200/60 dark:border-white/5">
                          "{qa.candidate_answer}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* INLINE RIGHT COLUMN (Rendered only when cameraDockMode === 'inline') */}
        {cameraDockMode === 'inline' && (
          <div className="lg:col-span-5 space-y-4 sticky top-[88px]">
            {renderProctorCameraCard()}

            {/* Session Guidelines Card under Camera */}
            <div className="card-theme p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Real-Time Adaptive Tips
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                State technical tradeoffs explicitly. The AI probes your architecture based on the exact keywords and frameworks you mention.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. END INTERVIEW CONFIRMATION MODAL */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-theme max-w-md w-full p-6 space-y-4 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              End Interview Early?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to conclude the interview? We will generate your final competency report based on the answers submitted so far.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="btn-secondary px-5 py-2.5 text-xs font-semibold"
              >
                Continue Interview
              </button>

              <button
                type="button"
                onClick={async () => {
                  stopSpeaking();
                  stopCamera();
                  await endInterview(sessionId);
                  onFinishInterview(sessionId);
                }}
                className="btn-primary bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold"
              >
                Conclude & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoomPage;
