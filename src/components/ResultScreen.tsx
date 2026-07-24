import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Activity, 
  Check, 
  ArrowRight,
  Stethoscope,
  Download,
  FileText,
  Loader2,
  Calendar,
  Clock,
  ShieldAlert,
  Info,
  Building2,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { SymptoReport, ConditionPossibility } from '../types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';

interface ResultScreenProps {
  report: SymptoReport;
  onReset: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ report, onReset }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium'>('all');

  const isHigh = report.riskLevel === 'High';
  const isMod = report.riskLevel === 'Moderate';

  const filteredConditions = report.conditions.filter((cond) => {
    if (selectedFilter === 'high') return cond.confidence === 'High';
    if (selectedFilter === 'medium') return cond.confidence === 'Medium';
    return true;
  });

  const handleDownloadPDF = () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Sympto WebMD-Grade Health Assessment Report", 14, 20);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${report.timestamp}  |  Powered by Gemma AI Diagnostic Engine`, 14, 26);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 30, 196, 30);

      // Risk Banner Box
      let yPos = 36;
      if (isHigh) {
        doc.setFillColor(225, 29, 72); // rose-600
      } else if (isMod) {
        doc.setFillColor(217, 119, 6); // amber-600
      } else {
        doc.setFillColor(5, 150, 105); // emerald-600
      }
      doc.roundedRect(14, yPos, 182, 16, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`EVALUATED RISK LEVEL: ${report.riskLevel.toUpperCase()} URGENCY RISK`, 20, yPos + 10.5);

      yPos += 24;

      // Emergency Red Flags if present
      if (report.redFlags && report.redFlags.length > 0) {
        doc.setFillColor(254, 242, 242); // rose-50
        doc.setDrawColor(248, 113, 113); // rose-400
        const rfHeight = 12 + (report.redFlags.length * 5);
        doc.roundedRect(14, yPos, 182, rfHeight, 3, 3, 'FD');

        doc.setTextColor(153, 27, 27); // rose-800
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("CRITICAL RED FLAGS / EMERGENCY WARNING SIGNS:", 18, yPos + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        report.redFlags.forEach((rf, i) => {
          doc.text(`• ${rf}`, 20, yPos + 12 + (i * 4.8));
        });

        yPos += rfHeight + 8;
      }

      // Section 1: Possible Conditions
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("1. Possible Conditions (Differential Diagnosis)", 14, yPos);
      yPos += 8;

      report.conditions.forEach((cond, idx) => {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${idx + 1}. ${cond.title}`, 18, yPos);

        // Confidence & Urgency badge text
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136); // teal-600
        const extraBadge = cond.urgency ? ` | Urgency: ${cond.urgency}` : '';
        doc.text(`[${cond.confidence} Confidence${extraBadge}]`, 130, yPos);

        yPos += 5.5;

        if (cond.affectedSystem) {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 116, 139);
          doc.text(`Affected System: ${cond.affectedSystem}`, 22, yPos);
          yPos += 4.5;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitDesc = doc.splitTextToSize(cond.description, 172);
        doc.text(splitDesc, 22, yPos);
        yPos += (splitDesc.length * 4.8);

        if (cond.matchedSymptoms && cond.matchedSymptoms.length > 0) {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 118, 110);
          doc.text(`Matched Symptoms: ${cond.matchedSymptoms.join(', ')}`, 22, yPos + 3);
          yPos += 5;
        }

        yPos += 5;
      });

      // Section 2: Reported Symptoms & Answer Details
      yPos += 4;
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("2. Precision Symptom Matching & History", 14, yPos);
      yPos += 8;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      report.whyMatched.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const cleanItem = `• ${item.replace(/^[✓\s]+/, '')}`;
        const splitItem = doc.splitTextToSize(cleanItem, 172);
        doc.text(splitItem, 18, yPos);
        yPos += (splitItem.length * 4.8) + 1;
      });

      if (report.questionHistory && report.questionHistory.length > 0) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text("Answered Follow-Up Questions:", 18, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        report.questionHistory.forEach((q, i) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const qText = doc.splitTextToSize(`Q${i + 1}: ${q.question}\nAnswer: "${q.answer}"`, 168);
          doc.text(qText, 22, yPos);
          yPos += (qText.length * 4.8) + 3;
        });
      }

      // Section 3: Recommendations
      yPos += 4;
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("3. Recommended Medical Next Steps", 14, yPos);
      yPos += 8;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      report.recommendations.forEach((rec) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const splitRec = doc.splitTextToSize(`• ${rec}`, 172);
        doc.text(splitRec, 18, yPos);
        yPos += (splitRec.length * 4.8) + 2;
      });

      // Section 4: Disclaimer Footer Box
      yPos += 6;
      if (yPos > 255) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.roundedRect(14, yPos, 182, 18, 3, 3, 'FD');

      doc.setTextColor(120, 53, 15); // amber-900
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("MEDICAL DISCLAIMER:", 18, yPos + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text("This document is an AI-assisted WebMD-style symptom analysis summary and is NOT a definitive medical diagnosis.", 18, yPos + 12);

      // Save PDF file
      const fileName = `Sympto_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("PDF generation failed, triggering print fallback:", error);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 max-w-3xl mx-auto space-y-6 selection:bg-teal-100 pb-20">
      
      {/* Header Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-2"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight block">
              Sympto Symptom Evaluation
            </span>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80">
              WebMD-Grade Diagnostic Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Top PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloading ? "Generating PDF..." : "Export PDF"}</span>
          </button>

          <button
            onClick={onReset}
            className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">New Assessment</span>
          </button>
        </div>
      </motion.div>

      {/* PRINTABLE CONTAINER WRAPPER */}
      <div id="sympto-report-printable" className="space-y-6 bg-slate-50 p-1 sm:p-2 rounded-3xl">

        {/* PDF Header Info */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">Sympto Clinical Assessment Report</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date().toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {report.timestamp}
            </span>
          </div>
        </div>

        {/* EMERGENCY RED FLAGS WARNING BANNER (IF PRESENT OR HIGH RISK) */}
        {(isHigh || (report.redFlags && report.redFlags.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-rose-900">
                Emergency Warning Signs & Red Flags
              </h3>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              If you experience any of the following critical symptoms, do not wait. Seek immediate medical assistance or visit the nearest emergency department:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(report.redFlags && report.redFlags.length > 0 ? report.redFlags : [
                "Difficulty breathing or severe chest pain",
                "High persistent fever above 39°C (102.2°F)",
                "Sudden severe headache or stiff neck",
                "Inability to retain fluids or severe confusion"
              ]).map((flag, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/90 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-ping" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TOP RISK LEVEL BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-3xl border shadow-xs flex items-center justify-between gap-4 ${
            isHigh
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isMod
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              Triage Urgency Assessment
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">
                {isHigh ? '🔴' : isMod ? '🟡' : '🟢'}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {report.riskLevel} Urgency Level
                </h2>
                <p className="text-xs opacity-90 font-medium">
                  {isHigh 
                    ? 'Prompt medical evaluation (Urgent Care / ER) is recommended.' 
                    : isMod 
                    ? 'Schedule a primary care appointment or visit a local clinic.' 
                    : 'Manage symptoms with self-care; consult doctor if persistent.'}
                </p>
              </div>
            </div>
          </div>

          <div className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase shrink-0 shadow-xs ${
            isHigh ? 'bg-rose-600 text-white' : isMod ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {report.riskLevel} Risk
          </div>
        </motion.div>

        {/* SECTION 1: POSSIBLE CONDITIONS (WebMD-Style Differential Diagnosis) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <span>Possible Conditions</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                WebMD-style differential diagnosis based on reported presentation
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({report.conditions.length})
              </button>
              <button
                onClick={() => setSelectedFilter('high')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === 'high' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                High Likelihood
              </button>
            </div>
          </div>

          {/* Condition List */}
          <div className="space-y-4">
            {filteredConditions.map((item, idx) => {
              const isHighConf = item.confidence === 'High';
              const isMedConf = item.confidence === 'Medium';

              return (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 hover:border-blue-300 transition-all shadow-2xs"
                >
                  {/* Title Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{item.title}</h4>
                        {item.affectedSystem && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            System: {item.affectedSystem}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.urgency && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 text-[10px] font-bold uppercase">
                          {item.urgency}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        isHighConf
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isMedConf
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {item.confidence} Confidence
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 font-normal leading-relaxed pl-1 sm:pl-9">
                    {item.description}
                  </p>

                  {/* Matched vs Unmatched Symptoms (WebMD Feature) */}
                  <div className="pl-1 sm:pl-9 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {item.matchedSymptoms && item.matchedSymptoms.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                        <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Matched Symptoms
                        </span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.matchedSymptoms.map((ms, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-medium text-[10px]">
                              {ms}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.unmatchedSymptoms && item.unmatchedSymptoms.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Typically Present (Unreported)
                        </span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.unmatchedSymptoms.map((ums, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium text-[10px]">
                              {ums}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </motion.div>

        {/* SECTION 2: WHY? (PRECISION SYMPTOM MATCHING & ANSWER HISTORY) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase text-slate-400">
              Diagnostic Evidence & Reasoning
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-800">
            Clinical factors matching your reported presentation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {report.whyMatched.map((symptom, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-900 text-xs font-semibold">
                <Check className="w-4 h-4 text-teal-600 shrink-0 stroke-[3]" />
                <span>{symptom.replace(/^[✓\s]+/, '')}</span>
              </div>
            ))}
          </div>

          {/* Display Question History if answered */}
          {report.questionHistory && report.questionHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Answered Precision Follow-Up Questions ({report.questionHistory.length})
              </span>
              <div className="space-y-1.5">
                {report.questionHistory.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <p className="text-slate-600 font-semibold text-[11px]">Q{idx + 1}: {q.question}</p>
                    <p className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      User Answer: "{q.answer}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* SECTION 3: RECOMMENDATIONS */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3"
        >
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Recommended Clinical Next Steps
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-700">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed font-medium">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* SECTION 4: CLEAR DISCLAIMER BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 text-amber-900 text-xs leading-relaxed font-medium flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-extrabold block text-amber-950">Medical Disclaimer</strong>
            <span>This tool provides informational symptom analysis for educational purposes only and does not substitute for professional medical diagnosis or treatment. Always consult a healthcare professional.</span>
          </div>
        </motion.div>

      </div>

      {/* ACTION BUTTONS BAR */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-teal-600/10 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span>{isDownloading ? "Generating PDF Report..." : "Download Full PDF Report"}</span>
        </button>

        <button
          onClick={onReset}
          className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-blue-600 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <span>Start New Assessment</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

    </div>
  );
};
