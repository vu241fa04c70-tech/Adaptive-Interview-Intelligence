import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Compass,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Award,
  Layers,
  Clock,
  Flame,
  ShieldCheck,
  Brain,
  RefreshCw,
  ExternalLink,
  CheckSquare,
  Square,
  Play,
  FileText,
  Upload,
  BarChart2,
  X,
  Code2,
  Briefcase
} from 'lucide-react';
import {
  fetchSupportedRoles,
  analyzeSkills,
  fetchLatestSkillAnalysis,
  compareTargetRoles,
  generateLearningRoadmap,
  fetchCurrentRoadmap,
  fetchUserSkillProgress,
  updateUserSkillProgress,
  fetchSkillQuiz,
  submitSkillQuiz,
  fetchMyResume
} from '../services/api';
import type {
  SkillAnalysisData,
  RoleComparisonData,
  LearningRoadmapData,
  ProgressOverview,
  QuizQuestion,
  QuizEvaluationResult,
  MyResumeResponse
} from '../types';

interface SkillGapPageProps {
  onStartInterviewWithCompetency?: (competency: string) => void;
}

export const SkillGapPage: React.FC<SkillGapPageProps> = ({ onStartInterviewWithCompetency }) => {
  // Navigation Tabs inside Skill Gap Module
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'analyze' | 'compare' | 'roadmap' | 'progress' | 'reassessment'
  >('dashboard');

  // Supported Taxonomy
  const [supportedRoles, setSupportedRoles] = useState<string[]>([]);
  const [roleCategories, setRoleCategories] = useState<Record<string, string>>({});

  // Active User Data
  const [storedResume, setStoredResume] = useState<MyResumeResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<SkillAnalysisData | null>(null);
  const [roadmapData, setRoadmapData] = useState<LearningRoadmapData | null>(null);
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [comparisonData, setComparisonData] = useState<RoleComparisonData | null>(null);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Form State: Analyze My Skills
  const [selectedRole, setSelectedRole] = useState<string>('Python Developer');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Intermediate');
  const [customJD, setCustomJD] = useState<string>('');
  const [resumeSource, setResumeSource] = useState<'stored' | 'upload' | 'text'>('stored');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState<string>('');

  // Form State: Roadmap Settings
  const [dailyCommitment, setDailyCommitment] = useState<'30m' | '1h' | '2h'>('1h');
  const [timelineWeeks, setTimelineWeeks] = useState<number>(4);

  // Form State: Role Comparison
  const [compareRolesList, setCompareRolesList] = useState<string[]>([
    'Python Developer',
    'Full Stack Developer',
    'Backend Developer'
  ]);

  // Skill Filtering
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGap, setFilterGap] = useState<string>('all');

  // Reassessment Quiz Modal State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeQuizSkill, setActiveQuizSkill] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizEvaluationResult | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoadingInitial(true);
      const [rolesRes, resumeRes, latestAnalysisRes, roadmapRes, progressRes] = await Promise.allSettled([
        fetchSupportedRoles(),
        fetchMyResume(),
        fetchLatestSkillAnalysis(),
        fetchCurrentRoadmap(),
        fetchUserSkillProgress()
      ]);

      if (rolesRes.status === 'fulfilled') {
        setSupportedRoles(rolesRes.value.supported_roles);
        setRoleCategories(rolesRes.value.categories);
        if (rolesRes.value.supported_roles.length > 0) {
          setSelectedRole(rolesRes.value.supported_roles[0]);
        }
      }

      if (resumeRes.status === 'fulfilled') {
        setStoredResume(resumeRes.value);
        if (!resumeRes.value.has_resume) {
          setResumeSource('text');
        }
      }

      if (latestAnalysisRes.status === 'fulfilled' && latestAnalysisRes.value.has_analysis) {
        const val = latestAnalysisRes.value;
        setAnalysisData({
          target_role: val.target_role || 'Python Developer',
          experience_level: val.experience_level || 'Intermediate',
          overall_match_percentage: val.overall_match_percentage || 0,
          readiness_status: val.readiness_status || 'Needs Focused Upskilling',
          summary: val.summary || '',
          critical_gaps_count: val.critical_gaps_count || 0,
          strengths_count: val.skill_breakdown?.filter((s: any) => s.gap_level === 'Strong').length || 0,
          strengths: val.skill_breakdown?.filter((s: any) => s.gap_level === 'Strong').map((s: any) => s.skill_name) || [],
          extracted_skills: val.extracted_skills || {},
          skill_breakdown: val.skill_breakdown || [],
          analysis_id: val.analysis_id
        });
      }

      if (roadmapRes.status === 'fulfilled' && roadmapRes.value.has_roadmap && roadmapRes.value.roadmap) {
        setRoadmapData(roadmapRes.value.roadmap);
      }

      if (progressRes.status === 'fulfilled') {
        setProgressOverview(progressRes.value);
      }
    } catch (err) {
      console.error('Error loading initial skill gap data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Run Skill Gap Analysis
  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const effectiveRole = selectedRole === 'Custom Role' ? customRoleInput || 'Custom Role' : selectedRole;

      const payload: any = {
        target_role: effectiveRole,
        experience_level: selectedLevel,
        custom_job_description: customJD.trim() ? customJD : undefined
      };

      if (resumeSource === 'upload' && uploadedFile) {
        payload.file = uploadedFile;
      } else if (resumeSource === 'text' && pastedResumeText.trim()) {
        payload.raw_resume_text = pastedResumeText;
      } else if (resumeSource === 'stored' && storedResume?.candidate?.id) {
        payload.candidate_id = storedResume.candidate.id;
      }

      const res = await analyzeSkills(payload);
      if (res.success && res.analysis) {
        setAnalysisData(res.analysis);
        // Refresh progress overview & roadmap
        fetchUserSkillProgress().then(setProgressOverview).catch(console.error);
        setActiveSubTab('dashboard');
      }
    } catch (err: any) {
      alert(`Skill Analysis Error: ${err.message || 'Please check resume input.'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate Learning Roadmap
  const handleGenerateRoadmap = async () => {
    try {
      setGeneratingRoadmap(true);
      const res = await generateLearningRoadmap({
        analysis_id: analysisData?.analysis_id,
        daily_commitment: dailyCommitment,
        timeline_weeks: timelineWeeks
      });
      if (res.milestones) {
        setRoadmapData(res);
        setActiveSubTab('roadmap');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate learning roadmap');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // Run Multi-Role Comparison
  const handleRunComparison = async () => {
    try {
      setComparing(true);
      const res = await compareTargetRoles(
        compareRolesList,
        selectedLevel,
        storedResume?.candidate?.id
      );
      setComparisonData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to compare roles');
    } finally {
      setComparing(false);
    }
  };

  // Toggle Checklist item in Progress
  const handleToggleChecklist = async (skillName: string, checklistId: string) => {
    if (!progressOverview) return;
    const skillItem = progressOverview.skills.find((s) => s.skill_name === skillName);
    if (!skillItem) return;

    const updatedChecklist = skillItem.checklist.map((c) =>
      c.id === checklistId ? { ...c, completed: !c.completed } : c
    );

    // Optimistic UI update
    const updatedSkills = progressOverview.skills.map((s) =>
      s.skill_name === skillName ? { ...s, checklist: updatedChecklist } : s
    );
    setProgressOverview({ ...progressOverview, skills: updatedSkills });

    try {
      await updateUserSkillProgress({
        skill_name: skillName,
        checklist: updatedChecklist
      });
    } catch (err) {
      console.error('Failed to update progress checklist', err);
    }
  };

  // Update Skill Proficiency / Notes in Progress
  const handleUpdateSkillNotes = async (skillName: string, notes: string) => {
    try {
      await updateUserSkillProgress({ skill_name: skillName, notes });
      const refreshed = await fetchUserSkillProgress();
      setProgressOverview(refreshed);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Reassessment Quiz
  const handleOpenQuiz = async (skillName: string) => {
    try {
      setActiveQuizSkill(skillName);
      setQuizModalOpen(true);
      setQuizLoading(true);
      setQuizResult(null);

      const quizData = await fetchSkillQuiz(skillName);
      setQuizQuestions(quizData.questions);
      setQuizAnswers(new Array(quizData.questions.length).fill(-1));
    } catch (err) {
      alert('Could not load quiz questions for this skill.');
      setQuizModalOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Reassessment Quiz
  const handleSubmitQuiz = async () => {
    if (quizAnswers.some((a) => a === -1)) {
      alert('Please select an answer for all questions before submitting.');
      return;
    }

    try {
      setQuizSubmitting(true);
      const res = await submitSkillQuiz(activeQuizSkill, quizAnswers);
      setQuizResult(res);

      if (res.passed) {
        // Refresh progress overview & latest analysis
        const [prog, latest] = await Promise.all([
          fetchUserSkillProgress(),
          fetchLatestSkillAnalysis()
        ]);
        setProgressOverview(prog);
        if (latest.has_analysis) {
          setAnalysisData({
            target_role: latest.target_role || '',
            experience_level: latest.experience_level || '',
            overall_match_percentage: latest.overall_match_percentage || 0,
            readiness_status: latest.readiness_status || '',
            summary: latest.summary || '',
            critical_gaps_count: latest.critical_gaps_count || 0,
            strengths_count: latest.skill_breakdown?.filter((s: any) => s.gap_level === 'Strong').length || 0,
            strengths: latest.skill_breakdown?.filter((s: any) => s.gap_level === 'Strong').map((s: any) => s.skill_name) || [],
            extracted_skills: latest.extracted_skills || {},
            skill_breakdown: latest.skill_breakdown || [],
            analysis_id: latest.analysis_id
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Filter skills in Breakdown view
  const filteredSkills = (analysisData?.skill_breakdown || []).filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterGap !== 'all' && item.gap_level !== filterGap) return false;
    return true;
  });

  if (loadingInitial) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm font-semibold">Loading Career Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 dark:bg-[#080B16] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Module Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Career Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Skill Gap Analysis & Personalized Career Roadmap
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Ground your career trajectory with automated gap diagnostics, verified official resources, 
                evidence-backed competency mapping, and technical reassessments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveSubTab('analyze')}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-900 text-xs font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                <span>Analyze New Role</span>
              </button>
              <button
                onClick={() => setActiveSubTab('roadmap')}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20"
              >
                <Compass className="w-4 h-4" />
                <span>View Roadmap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-white/10">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'analyze', label: 'Analyze My Skills', icon: Target },
            { id: 'compare', label: 'Role Comparison', icon: Layers },
            { id: 'roadmap', label: 'Personalized Roadmap', icon: Compass },
            { id: 'progress', label: 'My Learning Progress', icon: TrendingUp },
            { id: 'reassessment', label: 'Reassessment & Readiness', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  if (tab.id === 'compare' && !comparisonData) {
                    handleRunComparison();
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* SUB-VIEW 1: SKILL GAP DASHBOARD */}
        {/* ========================================================================= */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {!analysisData ? (
              <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-10 border border-slate-200 dark:border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Skill Analysis Record Found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Run your first target role analysis to discover your proficiency match, critical gaps, 
                  and receive a tailored learning roadmap.
                </p>
                <button
                  onClick={() => setActiveSubTab('analyze')}
                  className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold inline-flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Analyze My Skills Now</span>
                </button>
              </div>
            ) : (
              <>
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Metric 1: Match Score */}
                  <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Match</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                        {analysisData.target_role}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {analysisData.overall_match_percentage}%
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {analysisData.readiness_status}
                      </span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="mt-3 w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, analysisData.overall_match_percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metric 2: Critical Gaps */}
                  <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Critical Gaps</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                        {analysisData.critical_gaps_count}
                      </span>
                      <span className="text-[11px] text-slate-500">priority areas to close</span>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Focus on high-impact competencies first
                    </p>
                  </div>

                  {/* Metric 3: Verified / Demonstrated Skills */}
                  <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Strong Skills</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {analysisData.strengths_count}
                      </span>
                      <span className="text-[11px] text-slate-500">at required proficiency</span>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Demonstrated in code, projects, or interview
                    </p>
                  </div>

                  {/* Metric 4: Study Streak */}
                  <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Learning Streak</span>
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                        {progressOverview?.streak_days || 0}
                      </span>
                      <span className="text-[11px] text-slate-500">consecutive days active</span>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Daily micro-learning compounds growth
                    </p>
                  </div>
                </div>

                {/* Analysis Summary & Quick Recommendations Banner */}
                <div className="bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                        AI Skill Diagnostic Summary
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                      {analysisData.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={generatingRoadmap}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                      {generatingRoadmap ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                      <span>Generate Roadmap</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('reassessment')}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Take Reassessment</span>
                    </button>
                  </div>
                </div>

                {/* Breakdown Filter & Interactive Skill Matrix */}
                <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Target Role Competency Breakdown
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Evidence-evaluated mapping comparing your estimated proficiency with industry requirements.
                      </p>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                      >
                        <option value="all">All Categories</option>
                        {Object.entries(roleCategories).map(([k, label]) => (
                          <option key={k} value={k}>{label}</option>
                        ))}
                      </select>

                      <select
                        value={filterGap}
                        onChange={(e) => setFilterGap(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                      >
                        <option value="all">All Gaps</option>
                        <option value="Strong">Strong Skills</option>
                        <option value="Minor Gap">Minor Gap</option>
                        <option value="Moderate Gap">Moderate Gap</option>
                        <option value="Critical Gap">Critical Gap</option>
                        <option value="Missing">Missing</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSkills.map((sk) => {
                      const isStrong = sk.gap_level === 'Strong';
                      const isCritical = sk.gap_level === 'Critical Gap' || (sk.gap_level === 'Missing' && sk.importance === 'Critical');
                      
                      return (
                        <div
                          key={sk.skill_name}
                          className={`rounded-xl p-4 border transition-all ${
                            isStrong
                              ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/40'
                              : isCritical
                              ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40'
                              : 'bg-slate-50/50 dark:bg-white/5 border-slate-200/80 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {sk.skill_name}
                                </span>
                                {sk.verified && (
                                  <span className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Verified via ProofHire Reassessment">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                {sk.category_label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sk.importance === 'Critical'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : sk.importance === 'High'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}>
                                {sk.importance}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isStrong
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                              }`}>
                                {sk.gap_level}
                              </span>
                            </div>
                          </div>

                          {/* Proficiency Comparison Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              <span>
                                Estimated: <strong className="text-slate-900 dark:text-white">{sk.estimated_proficiency ? `Lvl ${sk.estimated_proficiency}/5` : 'Not Assessed'}</strong>
                              </span>
                              <span>
                                Required: <strong className="text-slate-900 dark:text-white">Lvl {sk.required_proficiency}/5</strong>
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1 h-1.5">
                              {[1, 2, 3, 4, 5].map((lvl) => {
                                const isCurrent = sk.estimated_proficiency && lvl <= sk.estimated_proficiency;
                                const isReq = lvl <= sk.required_proficiency;
                                return (
                                  <div
                                    key={lvl}
                                    className={`rounded-full transition-all ${
                                      isCurrent
                                        ? 'bg-blue-600 dark:bg-blue-500'
                                        : isReq
                                        ? 'bg-slate-300 dark:bg-white/20'
                                        : 'bg-slate-200 dark:bg-white/5'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Evidence Citation */}
                          <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-black/20 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[10px]">
                              <Brain className="w-3 h-3 text-indigo-500" />
                              <span>Evidence: {sk.evidence_type}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {sk.evidence_details}
                            </p>
                          </div>

                          {/* Action & Resource Link */}
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                            <a
                              href={sk.resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{sk.resource.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>

                            <button
                              onClick={() => handleOpenQuiz(sk.skill_name)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              <span>Reassess</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 2: ANALYZE MY SKILLS FORM */}
        {/* ========================================================================= */}
        {activeSubTab === 'analyze' && (
          <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Analyze My Skills Against Target Role
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your target career path and benchmark your existing competencies, projects, and interview records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Job Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {supportedRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="Custom Role">+ Custom Role / Custom Job Title</option>
                </select>

                {selectedRole === 'Custom Role' && (
                  <input
                    type="text"
                    placeholder="Enter custom role title (e.g. Site Reliability Engineer)"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium"
                  />
                )}
              </div>

              {/* Experience Level Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedLevel === lvl
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Source Selector */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Candidate Resume Source
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setResumeSource('stored')}
                  disabled={!storedResume?.has_resume}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    resumeSource === 'stored'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${!storedResume?.has_resume ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Briefcase className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Use Stored Resume
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {storedResume?.candidate?.resume_filename || 'No stored resume found'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResumeSource('upload')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    resumeSource === 'upload'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Upload className="w-4 h-4 text-indigo-600 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Upload PDF / DOCX
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Upload a new resume file
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResumeSource('text')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    resumeSource === 'text'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4 text-violet-600 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Paste Resume Text
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Paste raw experience & skills
                  </p>
                </button>
              </div>

              {resumeSource === 'upload' && (
                <div className="p-6 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl text-center space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {uploadedFile ? uploadedFile.name : 'Select or drop PDF/DOCX file'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              )}

              {resumeSource === 'text' && (
                <textarea
                  rows={4}
                  placeholder="Paste resume content, tech stack, and project descriptions..."
                  value={pastedResumeText}
                  onChange={(e) => setPastedResumeText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono"
                />
              )}
            </div>

            {/* Custom Job Description (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Job Description / Role Requirements (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Paste the target job description or specialized role requirements to extract custom competency benchmarks..."
                value={customJD}
                onChange={(e) => setCustomJD(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-6 py-3 rounded-xl btn-primary text-xs font-bold shadow-lg flex items-center gap-2"
              >
                {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                <span>{analyzing ? 'Analyzing Competencies...' : 'Run Skill Gap Analysis'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 3: ROLE COMPARISON */}
        {/* ========================================================================= */}
        {activeSubTab === 'compare' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Multi-Role Comparison & Transferable Skills
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Evaluate your fit across multiple career paths simultaneously to identify transferable strengths.
                </p>
              </div>

              {/* Role selection chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {supportedRoles.slice(0, 8).map((r) => {
                  const isSelected = compareRolesList.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (compareRolesList.length > 1) {
                            setCompareRolesList(compareRolesList.filter((x) => x !== r));
                          }
                        } else {
                          if (compareRolesList.length < 3) {
                            setCompareRolesList([...compareRolesList, r]);
                          } else {
                            alert('You can compare up to 3 roles simultaneously.');
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                      }`}
                    >
                      {r} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}

                <button
                  onClick={handleRunComparison}
                  disabled={comparing}
                  className="ml-auto px-4 py-2 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  {comparing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>Re-Compare</span>
                </button>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            {comparisonData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparisonData.roles_compared.map((item) => {
                    const isTop = item.role === comparisonData.recommended_role;
                    return (
                      <div
                        key={item.role}
                        className={`rounded-2xl p-6 border transition-all ${
                          isTop
                            ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700/50 shadow-md ring-1 ring-blue-500/30'
                            : 'bg-white dark:bg-[#0D1224] border-slate-200/80 dark:border-white/10'
                        }`}
                      >
                        {isTop && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white mb-3">
                            <Sparkles className="w-3 h-3" /> Recommended Role Fit
                          </span>
                        )}

                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.role}
                        </h3>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            {item.overall_match}%
                          </span>
                          <span className="text-xs text-slate-500">match</span>
                        </div>

                        <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {item.readiness_status}
                        </span>

                        <div className="mt-5 space-y-3 pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span>Estimated Weeks to Ready:</span>
                            <strong className="text-slate-900 dark:text-white">{item.estimated_weeks_to_ready} weeks</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span>Critical Gaps:</span>
                            <strong className="text-amber-600 dark:text-amber-400">{item.critical_gaps}</strong>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Top Strengths:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.top_strengths.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Priority Gaps:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.top_gaps.map((g) => (
                                <span key={g} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Common Transferable Skills Box */}
                <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cross-Role Transferable Assets
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    These competencies apply effectively across all selected target roles without redundant retraining:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comparisonData.common_transferable_skills.map((ts) => (
                      <span
                        key={ts}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        ✓ {ts}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 4: PERSONALIZED LEARNING ROADMAP */}
        {/* ========================================================================= */}
        {activeSubTab === 'roadmap' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Roadmap Settings Header */}
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Personalized Learning Roadmap
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Targeting {roadmapData?.target_role || analysisData?.target_role || 'Target Role'} with structured weekly milestones.
                </p>
              </div>

              {/* Configurator Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  {(['30m', '1h', '2h'] as const).map((cmt) => (
                    <button
                      key={cmt}
                      onClick={() => setDailyCommitment(cmt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        dailyCommitment === cmt
                          ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cmt}/day
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  {[2, 4, 8].map((wks) => (
                    <button
                      key={wks}
                      onClick={() => setTimelineWeeks(wks)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        timelineWeeks === wks
                          ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {wks} Weeks
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateRoadmap}
                  disabled={generatingRoadmap}
                  className="px-4 py-2 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  {generatingRoadmap ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Milestones Timeline */}
            {!roadmapData ? (
              <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-10 border border-slate-200 dark:border-white/10 text-center space-y-4">
                <Compass className="w-10 h-10 text-blue-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Roadmap Generated
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to generate an actionable timeline based on your identified gaps.
                </p>
                <button
                  onClick={handleGenerateRoadmap}
                  className="px-4 py-2 rounded-xl btn-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span>Generate Roadmap Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {roadmapData.milestones.map((ms) => (
                  <div
                    key={ms.week}
                    className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {ms.phase}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {ms.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {ms.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {ms.skills_targeted.map((sk) => (
                          <span
                            key={sk}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Tasks List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Targeted Study & Coding Tasks
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ms.tasks.map((task) => (
                          <div
                            key={task.task_id}
                            className="bg-slate-50/60 dark:bg-white/5 rounded-xl p-4 border border-slate-200/60 dark:border-white/5 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {task.title}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.duration_minutes} min
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                              {task.exercise}
                            </p>

                            <div className="pt-2 flex items-center justify-between border-t border-slate-200/40 dark:border-white/5">
                              <a
                                href={task.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>{task.resource_title}</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio Blueprint Box */}
                    <div className="bg-linear-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                          Portfolio-Grade Project Blueprint: {ms.project_blueprint.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {ms.project_blueprint.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-500 text-[11px] font-bold">Tech Stack:</span>
                        {ms.project_blueprint.tech_stack.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span><strong>Deliverable:</strong> {ms.project_blueprint.deliverable}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 5: MY LEARNING PROGRESS */}
        {/* ========================================================================= */}
        {activeSubTab === 'progress' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Stats */}
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  My Learning Progress & Checklist
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Track completed exercises, personal notes, and verified competencies.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span>{progressOverview?.streak_days || 0} Day Streak</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{progressOverview?.verified_count || 0} Verified</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span>{progressOverview?.completion_percentage || 0}% Completed</span>
                </div>
              </div>
            </div>

            {/* Tracked Skills Progress Cards */}
            {(!progressOverview || progressOverview.skills.length === 0) ? (
              <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-10 border border-slate-200 dark:border-white/10 text-center space-y-4">
                <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Tracked Skills Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Run a skill gap analysis to automatically seed your interactive study checklist.
                </p>
                <button
                  onClick={() => setActiveSubTab('analyze')}
                  className="px-4 py-2 rounded-xl btn-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Target className="w-4 h-4" />
                  <span>Analyze Skills</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressOverview.skills.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#0D1224] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.skill_name}
                          </h3>
                          {item.reassessment_passed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {item.category_label}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenQuiz(item.skill_name)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        <span>Reassess</span>
                      </button>
                    </div>

                    {/* Interactive Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Action Checklist
                      </span>
                      <div className="space-y-1.5">
                        {item.checklist.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleToggleChecklist(item.skill_name, c.id)}
                            className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors select-none"
                          >
                            {c.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={c.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                              {c.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Personal Study Notes
                      </span>
                      <input
                        type="text"
                        defaultValue={item.notes || ''}
                        onBlur={(e) => handleUpdateSkillNotes(item.skill_name, e.target.value)}
                        placeholder="Add quick notes, key syntaxes, or project links..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 6: REASSESSMENT & CAREER READINESS */}
        {/* ========================================================================= */}
        {activeSubTab === 'reassessment' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Skill Reassessment & Career Readiness
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Validate your skills through technical assessments. Scoring ≥ 75% converts claimed competencies 
                  into verified demonstrated status on your profile.
                </p>
              </div>

              {/* Quick Reassessment launcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'React', 'Data Structures & Algorithms'].map((sk) => (
                  <div
                    key={sk}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sk}
                      </h4>
                      <p className="text-[10px] text-slate-500">3 Technical Questions</p>
                    </div>
                    <button
                      onClick={() => handleOpenQuiz(sk)}
                      className="px-3 py-1.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Readiness Checklist Card */}
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Career Readiness Checklist
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white">Core Tech Alignment</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Target role match is currently at <strong>{analysisData?.overall_match_percentage || 0}%</strong>.
                    Aim for ≥ 75% for competitive interview readiness.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white">Portfolio Readiness</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Build the milestone project blueprint from your roadmap to showcase tangible architecture on GitHub.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white">Mock Interview Practice</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Practice with ProofHire AI's proctored adaptive interview room to test technical communication.
                  </p>
                  <button
                    onClick={() => onStartInterviewWithCompetency?.(analysisData?.target_role || 'Python Developer')}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>Practice in AI Mock Interview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REASSESSMENT QUIZ MODAL */}
        {/* ========================================================================= */}
        {quizModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0D1224] rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Technical Reassessment: {activeQuizSkill}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Score ≥ 75% to verify and upgrade your proficiency rating.
                  </p>
                </div>
                <button
                  onClick={() => setQuizModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {quizLoading ? (
                  <div className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading quiz questions...
                  </div>
                ) : quizResult ? (
                  /* Quiz Result Screen */
                  <div className="space-y-6">
                    <div className={`p-5 rounded-2xl border text-center space-y-2 ${
                      quizResult.passed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200'
                    }`}>
                      <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-white dark:bg-white/10 shadow-xs">
                        {quizResult.passed ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
                      </div>
                      <h4 className="text-base font-extrabold">
                        {quizResult.passed ? 'Reassessment Passed!' : 'Needs Review'}
                      </h4>
                      <p className="text-xs">
                        Score: <strong>{quizResult.score_percentage}%</strong> ({quizResult.correct_count}/{quizResult.total_questions} correct)
                      </p>
                      {quizResult.passed && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          🎉 Your proficiency in <strong>{activeQuizSkill}</strong> has been upgraded to Level 4 (Proficient) and verified on your profile!
                        </p>
                      )}
                    </div>

                    {/* Explanations */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-slate-700 dark:text-slate-300">Question Feedback:</h5>
                      {quizResult.feedback.map((fb, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                          <div className="flex items-start gap-2">
                            {fb.is_correct ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                              {fb.question}
                            </p>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] pl-6">
                            <strong>Explanation:</strong> {fb.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Quiz Questions */
                  <div className="space-y-6">
                    {quizQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-3 p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                        <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                quizAnswers[qIdx] === optIdx
                                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-100 font-medium'
                                  : 'border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${qIdx}`}
                                checked={quizAnswers[qIdx] === optIdx}
                                onChange={() => {
                                  const updated = [...quizAnswers];
                                  updated[qIdx] = optIdx;
                                  setQuizAnswers(updated);
                                }}
                                className="mt-0.5 text-blue-600"
                              />
                              <span className="leading-snug">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
                {quizResult ? (
                  <button
                    onClick={() => setQuizModalOpen(false)}
                    className="px-5 py-2 rounded-xl btn-primary text-xs font-bold"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setQuizModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={quizSubmitting || quizLoading}
                      className="px-5 py-2 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5"
                    >
                      {quizSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                      <span>Submit Answers</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
