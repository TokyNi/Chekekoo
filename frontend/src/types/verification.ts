export type Verdict =
  | "true"
  | "mostly_true"
  | "partially_true"
  | "misleading"
  | "false"
  | "unverifiable";

export type CreateVerificationPayload = {
  content: string;
  source_url?: string;
};

export type SourceReview = {
  name: string;
  url: string;
  date: string | null;
  position: string;
  evidence: string;
};

export type VerificationAnalysis = {
  reliability_score: number | null;
  confidence_score: number | null;
  verdict: Verdict;
  summary: string;
  arguments: string[];
  conclusion: string;
  sources: SourceReview[];
};

export type VerificationResponse = {
  id: string;
  content: string;
  source_url: string | null;
  status: "completed";
  created_at: string;
  analysis: VerificationAnalysis;
};
