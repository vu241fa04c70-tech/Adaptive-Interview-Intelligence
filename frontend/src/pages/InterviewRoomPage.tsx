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
  Flag
} from 'lucide-react';
import {
  fetchInterviewSession,
  startInterview,
  submitAnswer,
  endInterview
} from '../services/api';
import type { InterviewSession } from '../types';
import VoiceWaveform from '../components/VoiceWaveform';
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
  } | null>(null);

  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  // History drawer toggle
  const [showHistory, setShowHistory] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Load session & start Q1
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const sess = await fetchInterviewSession(sessionId);
        setSession(sess);

        if (sess.qa_history && sess.qa_history.length > 0) {
          const lastQa = sess.qa_history[sess.qa_history.length - 1];
          // If last QA is unanswered, display it
          if (!lastQa.candidate_answer) {
            setCurrentQuestion({
              question_index: lastQa.question_index,
              question_text: lastQa.question_text,
              question_type: lastQa.question_type,
              target_competency: lastQa.target_competency || 'General',
              difficulty: lastQa.difficulty,
              reason_for_next_question: lastQa.reason_for_next_question || ''
            });
          } else {
            // Trigger start/fetch next
            const startRes = await startInterview(sessionId);
            setCurrentQuestion(startRes.first_question);
          }
        } else {
          // Start interview
          const startRes = await startInterview(sessionId);
          setCurrentQuestion(startRes.first_question);
        }

        // Auto TTS if voice mode
        if (sess.mode === 'voice' && currentQuestion?.question_text) {
          handlePlayAudio(currentQuestion.question_text);
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
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play spoken question
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

  // Toggle voice recognition
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
    if (!answerInput.trim() || submitting || !currentQuestion) return;

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
        // Complete session
        await endInterview(sessionId);
        onFinishInterview(sessionId);
      } else if (res.next_question_text) {
        const nextQ = {
          question_index: res.next_question_index || currentQuestion.question_index + 1,
          question_text: res.next_question_text,
          question_type: res.next_question_type || 'follow_up',
          target_competency: res.next_target_competency || 'Competency',
          difficulty: res.next_question_difficulty || 'intermediate',
          reason_for_next_question: res.reason_for_next_question
        };
        setCurrentQuestion(nextQ);

        // If voice mode, auto play question
        if (session?.mode === 'voice') {
          handlePlayAudio(nextQ.question_text);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    try {
      await endInterview(sessionId);
      onFinishInterview(sessionId);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Format MM:SS timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Initializing ProofHire AI Interview Room...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      {/* Header Room Controller */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 z-30 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {session?.role}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                {session?.target_difficulty}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Candidate: {session?.candidate_name}</p>
          </div>
        </div>

        {/* Live Timer & Waveform Badge */}
        <div className="flex items-center gap-4">
          <VoiceWaveform isActive={isSpeaking || isRecording} label={isSpeaking ? 'AI Speaking' : isRecording ? 'Recording' : 'Idle'} />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300 font-semibold">{formatTimer(elapsedSeconds)}</span>
            <span className="text-slate-500">/ {session?.duration_minutes}m</span>
          </div>

          <button
            onClick={() => setShowEndConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" /> End Interview
          </button>
        </div>
      </div>

      {/* Main Interview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Question Card + Input Box */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interviewer Avatar & Question Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                  Q{currentQuestion?.question_index || 1}
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Competency: <strong className="text-indigo-400">{currentQuestion?.target_competency}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                  {currentQuestion?.question_type}
                </span>

                <button
                  onClick={() =>
                    isSpeaking
                      ? handleStopAudio()
                      : currentQuestion?.question_text && handlePlayAudio(currentQuestion.question_text)
                  }
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Play / Stop Question Audio"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-slate-100 text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {currentQuestion?.question_text}
            </div>

            {/* Structured AI Reasoning Badge */}
            {currentQuestion?.reason_for_next_question && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">Internal AI Selection Rationale:</span>
                  <p className="text-slate-400 mt-0.5">{currentQuestion.reason_for_next_question}</p>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Answer Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Answer Input
              </label>

              <button
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice Speech Input
                  </>
                )}
              </button>
            </div>

            {speechError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {speechError}
              </div>
            )}

            <textarea
              rows={5}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Type your detailed answer here... (e.g., Explain your approach, practical experience, architecture trade-offs, and edge-case handling)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {answerInput.split(/\s+/).filter(Boolean).length} words
              </span>

              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerInput.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Evaluating Answer...
                  </>
                ) : (
                  <>
                    Submit Answer & Next Question
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Competency State & Q&A History */}
        <div className="space-y-6">
          {/* Live Competency Status Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Competency Map State</span>
              <span className="text-[10px] text-slate-400 font-normal">Real-time update</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {session?.competency_map &&
                Object.values(session.competency_map).map((comp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[170px]">
                        {comp.name}
                      </span>
                      <span className="text-indigo-400 font-semibold">
                        {(comp.score || 0).toFixed(1)} / 4.0
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-500"
                        style={{ width: `${((comp.score || 0) / 4.0) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Answered Questions Accordion Drawer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider"
            >
              <span>Session History ({session?.qa_history?.length || 0})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1 text-xs">
                {session?.qa_history?.map((qa) => (
                  <div key={qa.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-400 font-semibold">
                      <span>Q{qa.question_index}: {qa.target_competency}</span>
                      <span>Score: {qa.score?.toFixed(1)}/4.0</span>
                    </div>
                    <p className="text-slate-300 line-clamp-2">{qa.question_text}</p>
                    {qa.candidate_answer && (
                      <p className="text-slate-400 italic line-clamp-2 text-[11px] border-l-2 border-indigo-500 pl-2">
                        "{qa.candidate_answer}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal to End Interview Early */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">End Interview Early?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to finish the session now? A comprehensive performance report will be generated based on answers submitted so far.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Continue Interview
              </button>

              <button
                onClick={handleEndInterviewEarly}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30"
              >
                End & Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoomPage;
