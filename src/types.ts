export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface ConditionPossibility {
  title: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  matchedSymptoms?: string[];
  unmatchedSymptoms?: string[];
  affectedSystem?: string;
  urgency?: 'Self-Care' | 'Primary Care' | 'Urgent Care' | 'Emergency Room';
}

export interface QuestionTurn {
  question: string;
  answer: string;
}

export interface SymptoReport {
  riskLevel: RiskLevel;
  conditions: ConditionPossibility[];
  whyMatched: string[];
  recommendations: string[];
  redFlags?: string[];
  userSymptoms: string;
  timestamp: string;
  questionHistory?: QuestionTurn[];
}

export interface AnalysisResponse {
  needFollowUp: boolean;
  followUpQuestion?: string | null;
  suggestedOptions?: string[];
  questionNumber?: number;
  estimatedTotalQuestions?: number;
  riskLevel?: RiskLevel;
  conditions?: ConditionPossibility[];
  whyMatched?: string[];
  recommendations?: string[];
  redFlags?: string[];
}


