/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ThreatStatus {
  SAFE = "SAFE",
  SUSPICIOUS = "SUSPICIOUS",
  DANGEROUS = "DANGEROUS",
  MALICIOUS = "MALICIOUS"
}

export enum ThreatClassification {
  LEGITIMATE = "legitimate",
  PHISHING = "phishing",
  MALWARE = "malware",
  SPAM = "spam",
  UNKNOWN = "unknown"
}

export interface DomainDetails {
  registrar?: string;
  age?: string;
  sslStatus?: string;
  serverLocation?: string;
}

export interface UrlCheckResult {
  url: string;
  safetyScore: number; // 0 - 100
  probability: number; // 0.0 - 1.0
  status: ThreatStatus;
  classification: ThreatClassification;
  threatReport: string;
  domainDetails: DomainDetails;
  riskIndicators: string[];
  reputationImpact: number;
}

export interface BlacklistEntry {
  id: string;
  url: string;
  flaggedBy: string; // Eth Address
  timestamp: string;
  reason: string;
  score: number;
  txHash: string;
  votesUp: number;
  votesDown: number;
  status: 'active' | 'appealed' | 'cleared';
}

export interface Reporter {
  address: string;
  username: string;
  reputationScore: number;
  totalSubmissions: number;
  validatorsMet: number;
  stakedToken: number;
}
