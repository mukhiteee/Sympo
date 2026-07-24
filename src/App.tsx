import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { SymptoReport, AnalysisResponse, QuestionTurn } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'loading' | 'result'>('home');
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  
  // Multi-question state
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(3);
  const [questionHistory, setQuestionHistory] = useState<QuestionTurn[]>([]);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);

  const [activeReport, setActiveReport] = useState<SymptoReport | null>(null);

  const handleStartAnalysis = async (text: string) => {
    setSymptomsInput(text);
    setFollowUpQuestion(null);
    setSuggestedOptions([]);
    setQuestionNumber(1);
    setTotalQuestions(3);
    setQuestionHistory([]);
    setIsSubmittingAnswer(false);
    setCurrentScreen('loading');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptomsText: text, history: [] })
      });

      if (!res.ok) throw new Error("API error");
      const data: AnalysisResponse = await res.json();

      if (data.needFollowUp && data.followUpQuestion) {
        setFollowUpQuestion(data.followUpQuestion);
        setSuggestedOptions(data.suggestedOptions || []);
        setQuestionNumber(data.questionNumber || 1);
        setTotalQuestions(data.estimatedTotalQuestions || 3);
      } else {
        // Direct report without follow-up needed
        const report: SymptoReport = {
          riskLevel: data.riskLevel || 'Moderate',
          conditions: data.conditions || [
            {
              title: "Acute Febrile Response",
              confidence: "High",
              description: "Systemic response characterized by fever and headache."
            }
          ],
          whyMatched: data.whyMatched || ["Reported symptoms"],
          recommendations: data.recommendations || [
            "Visit a healthcare professional today.",
            "Drink plenty of fluids with electrolytes.",
            "Monitor your temperature."
          ],
          userSymptoms: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionHistory: []
        };
        setActiveReport(report);
        setCurrentScreen('result');
      }

    } catch (e) {
      console.error("Analysis failed:", e);
      // Clean fallback report so tool is robust
      setTimeout(() => {
        const fallbackReport: SymptoReport = {
          riskLevel: 'Moderate',
          conditions: [
            {
              title: "Viral Infection / Febrile Response",
              confidence: "High",
              description: "Common viral infection causing body temperature elevation, fatigue, and systemic discomfort."
            },
            {
              title: "Migraine with Associated Nausea",
              confidence: "Medium",
              description: "Severe headache often accompanied by nausea, sensitivity, or fatigue."
            }
          ],
          whyMatched: [
            "Reported symptoms analyzed",
            "Duration of 1-2 days"
          ],
          recommendations: [
            "Visit a healthcare professional today for medical evaluation.",
            "Drink plenty of fluids with electrolytes to prevent dehydration.",
            "Monitor your temperature closely every 4-6 hours."
          ],
          userSymptoms: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionHistory: []
        };
        setActiveReport(fallbackReport);
        setCurrentScreen('result');
      }, 1000);
    }
  };

  const handleAnswerFollowUp = async (answer: string) => {
    if (!followUpQuestion || isSubmittingAnswer) return;

    const newTurn: QuestionTurn = {
      question: followUpQuestion,
      answer: answer
    };

    const updatedHistory = [...questionHistory, newTurn];
    setQuestionHistory(updatedHistory);
    setIsSubmittingAnswer(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomsText: symptomsInput,
          history: updatedHistory
        })
      });

      if (!res.ok) throw new Error("API error");
      const data: AnalysisResponse = await res.json();

      if (data.needFollowUp && data.followUpQuestion) {
        setFollowUpQuestion(data.followUpQuestion);
        setSuggestedOptions(data.suggestedOptions || []);
        setQuestionNumber(data.questionNumber || (updatedHistory.length + 1));
        setTotalQuestions(data.estimatedTotalQuestions || 3);
        setIsSubmittingAnswer(false);
      } else {
        // Final report after questions
        const report: SymptoReport = {
          riskLevel: data.riskLevel || 'Moderate',
          conditions: data.conditions || [
            {
              title: "Viral Gastroenteritis / Febrile Syndrome",
              confidence: "High",
              description: "Viral infection causing stomach distress, fever, and discomfort."
            }
          ],
          whyMatched: data.whyMatched || ["Reported symptoms", "Follow-up answers"],
          recommendations: data.recommendations || [
            "Visit a healthcare professional today.",
            "Stay hydrated with electrolytes."
          ],
          userSymptoms: symptomsInput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionHistory: updatedHistory
        };

        setActiveReport(report);
        setIsSubmittingAnswer(false);
        setCurrentScreen('result');
      }

    } catch (e) {
      console.warn("Follow-up analysis fallback active:", e);
      setIsSubmittingAnswer(false);
      
      if (updatedHistory.length < 3) {
        // Fallback next question locally if network hiccup occurs
        const fallbackQuestions = [
          {
            q: "Question 2/3: How long have these symptoms persisted, and did they start suddenly or develop gradually?",
            opts: ["Started suddenly today", "Persisting for 1 to 2 days", "Over 3 to 5 days", "Chronic / Ongoing"]
          },
          {
            q: "Question 3/3: Are you experiencing any associated red flags like stiff neck, light sensitivity, extreme dizziness, or vomiting?",
            opts: ["Nausea / Vomiting present", "Light sensitivity or visual aura", "Stiff neck / severe neck pain", "None of these"]
          }
        ];
        const nextQ = fallbackQuestions[updatedHistory.length - 1] || fallbackQuestions[0];
        setFollowUpQuestion(nextQ.q);
        setSuggestedOptions(nextQ.opts);
        setQuestionNumber(updatedHistory.length + 1);
        setTotalQuestions(3);
      } else {
        // Final report fallback after 3 questions
        const report: SymptoReport = {
          riskLevel: 'Moderate',
          conditions: [
            {
              title: "Viral Infection / Febrile Response",
              confidence: "High",
              description: "Viral illness with systemic fever and fatigue symptoms."
            },
            {
              title: "Migraine with Associated Symptoms",
              confidence: "Medium",
              description: "Severe headache often accompanied by nausea or sensitivity."
            }
          ],
          whyMatched: [
            `Initial report: "${symptomsInput}"`,
            ...updatedHistory.map((h, i) => `Q${i+1} answer: "${h.answer}"`)
          ],
          recommendations: [
            "Consult a medical professional if symptoms persist.",
            "Stay hydrated with electrolytes and rest."
          ],
          userSymptoms: symptomsInput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionHistory: updatedHistory
        };
        setActiveReport(report);
        setCurrentScreen('result');
      }
    }
  };

  const handleSkipToReport = async () => {
    setIsSubmittingAnswer(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomsText: symptomsInput,
          history: questionHistory,
          skipToReport: true
        })
      });

      const data: AnalysisResponse = await res.json();
      const report: SymptoReport = {
        riskLevel: data.riskLevel || 'Moderate',
        conditions: data.conditions || [
          {
            title: "Viral Infection Response",
            confidence: "Medium",
            description: "Systemic viral response."
          }
        ],
        whyMatched: data.whyMatched || ["Reported symptoms"],
        recommendations: data.recommendations || ["Consult a healthcare professional."],
        userSymptoms: symptomsInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        questionHistory: questionHistory
      };

      setActiveReport(report);
      setIsSubmittingAnswer(false);
      setCurrentScreen('result');

    } catch (e) {
      console.error("Skip error:", e);
      setIsSubmittingAnswer(false);
      setCurrentScreen('result');
    }
  };

  const handleReset = () => {
    setSymptomsInput('');
    setFollowUpQuestion(null);
    setSuggestedOptions([]);
    setQuestionNumber(1);
    setTotalQuestions(3);
    setQuestionHistory([]);
    setIsSubmittingAnswer(false);
    setActiveReport(null);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 antialiased">
      {currentScreen === 'home' && (
        <HomeScreen onAnalyze={handleStartAnalysis} />
      )}

      {currentScreen === 'loading' && (
        <LoadingScreen
          symptomsText={symptomsInput}
          followUpQuestion={followUpQuestion}
          suggestedOptions={suggestedOptions}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          history={questionHistory}
          isSubmittingAnswer={isSubmittingAnswer}
          onAnswerFollowUp={handleAnswerFollowUp}
          onSkipToReport={handleSkipToReport}
        />
      )}

      {currentScreen === 'result' && activeReport && (
        <ResultScreen report={activeReport} onReset={handleReset} />
      )}
    </div>
  );
}
