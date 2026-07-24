import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, ArrowRight, Activity, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeScreenProps {
  onAnalyze: (symptoms: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAnalyze }) => {
  const [symptomsText, setSymptomsText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSymptomsText((prev) => {
            const trimmed = prev.trim();
            if (trimmed.toLowerCase().includes(transcript.toLowerCase())) return prev;
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert("Voice input is simulated or not supported in this browser tab. Typing works directly!");
      return;
    }

    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionInstance?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleQuickExample = (text: string) => {
    setSymptomsText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsText.trim()) return;
    onAnalyze(symptomsText.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 md:p-12 max-w-2xl mx-auto selection:bg-teal-100">
      
      {/* Top Header / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Sympto
              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Powered by Gemma
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Simple AI Symptom Understanding</p>
          </div>
        </div>
      </motion.div>

      {/* Main Form Center Content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="my-auto py-8 space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            What's bothering you today?
          </h2>
          <p className="text-sm text-slate-500 font-normal leading-relaxed">
            Describe your symptoms naturally. Understand what they could indicate in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Main Rounded Input Canvas */}
          <div className="relative group">
            <textarea
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
              placeholder="I've had a severe headache since yesterday. My body is hot and I've been vomiting..."
              className="w-full h-44 p-5 rounded-3xl bg-white border-2 border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 text-base placeholder:text-slate-400 focus:outline-none transition-all resize-none shadow-xs font-normal leading-relaxed"
            />

            {/* Bottom Input Action Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pt-2 border-t border-slate-100 bg-white/90 backdrop-blur-xs rounded-b-2xl">
              
              {/* Voice Microphone Toggle */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Listening... Tap to stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>Speak symptoms</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {symptomsText.length} chars
              </span>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Try an example
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "Severe headache, high fever and vomiting since yesterday",
                "Stomach pain, nausea and low energy for 2 days",
                "Dry cough, sore throat and mild body ache"
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickExample(example)}
                  className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-slate-700 text-xs transition-all font-medium text-left shadow-2xs"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={!symptomsText.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-base shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99]"
          >
            <span>Analyze Symptoms</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </form>
      </motion.div>

      {/* Footer Disclaimer */}
      <div className="pt-6 border-t border-slate-200/60 text-center">
        <p className="text-[11px] text-slate-400 font-normal">
          Sympto provides educational health insights powered by Gemma. Not a medical diagnosis.
        </p>
      </div>

    </div>
  );
};
