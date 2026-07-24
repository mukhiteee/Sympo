import React, { useState } from 'react';
import { Activity, Sparkles, Send, ArrowRight, SkipForward, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { QuestionTurn } from '../types';

interface LoadingScreenProps {
  symptomsText: string;
  followUpQuestion?: string | null;
  suggestedOptions?: string[];
  questionNumber?: number;
  totalQuestions?: number;
  history?: QuestionTurn[];
  isSubmittingAnswer?: boolean;
  onAnswerFollowUp?: (answer: string) => void;
  onSkipToReport?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  symptomsText,
  followUpQuestion,
  suggestedOptions = [],
  questionNumber = 1,
  totalQuestions = 3,
  history = [],
  isSubmittingAnswer = false,
  onAnswerFollowUp,
  onSkipToReport,
}) => {
  const [followUpInput, setFollowUpInput] = useState('');

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || !onAnswerFollowUp || isSubmittingAnswer) return;
    const text = followUpInput.trim();
    setFollowUpInput('');
    onAnswerFollowUp(text);
  };

  const handleOptionClick = (opt: string) => {
    if (!onAnswerFollowUp || isSubmittingAnswer) return;
    setFollowUpInput('');
    onAnswerFollowUp(opt);
  };

  const defaultOptions = suggestedOptions.length > 0 ? suggestedOptions : [
    "Yes, definitely",
    "Mildly / Slightly",
    "No, not at all",
    "Not sure / Unknown"
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-lg mx-auto selection:bg-teal-100">
      
      {(!followUpQuestion || isSubmittingAnswer) ? (
        /* Animated Gemma Processing Canvas */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 my-auto"
        >
          {/* Animated Gemma Core Ring */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.7, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-teal-400/20 border border-teal-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              className="absolute inset-2 rounded-full bg-blue-500/15 border border-blue-500/20"
            />

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 z-10">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {history.length > 0 ? "Evaluating answers..." : "Analyzing reported symptoms..."}
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Gemma is processing clinical symptoms to form precise diagnostic pathways.
            </p>
          </div>

          {/* History summary badge if questions were answered */}
          {history.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-left text-xs space-y-2 max-w-sm mx-auto">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                Answered Details ({history.length})
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {history.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-teal-600">✓</span>
                    <span className="line-clamp-1 font-medium">{item.answer}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ) : (
        /* Multi-Question Gemma Follow-Up Screen */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full my-auto space-y-5 text-left"
        >
          {/* Header Step Counter & Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
                  Precision Assessment
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Question {questionNumber} of {totalQuestions}
                </span>
              </div>
            </div>

            {/* Precision Indicator Bar */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">Precision</span>
              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(30, (questionNumber / (totalQuestions + 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 bg-white rounded-3xl border-2 border-teal-200/90 shadow-xl shadow-teal-500/5 space-y-5">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block">
                Gemma Follow-Up
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                {followUpQuestion}
              </h3>
            </div>

            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              
              {/* Quick Choice Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select an answer or type below
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {defaultOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isSubmittingAnswer}
                      onClick={() => handleOptionClick(opt)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-800 text-xs font-bold border border-slate-200/90 transition-all text-left flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span>{opt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Or type custom details..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500 text-slate-900 text-sm font-medium"
                />

                <button
                  type="submit"
                  disabled={!followUpInput.trim() || isSubmittingAnswer}
                  className="w-full py-3.5 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Next Question</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>

          {/* Option to Skip & Generate Report directly */}
          {onSkipToReport && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onSkipToReport}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip remaining questions & generate report now</span>
              </button>
            </div>
          )}

        </motion.div>
      )}

    </div>
  );
};
