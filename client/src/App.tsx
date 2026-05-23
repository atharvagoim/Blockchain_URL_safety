/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldX, Key, Cpu, Sparkles, Send, Plus, 
  Layers, FileCode, Award, Coins, HelpCircle, Check, Info, 
  ExternalLink, ArrowUpRight, TrendingUp, ChevronRight, CheckCircle2, Globe, AlertTriangle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  UrlCheckResult, BlacklistEntry, Reporter, ThreatStatus, ThreatClassification 
} from "./types";
import { SmartContractInspector } from "./components/SmartContractInspector";
import { ExtensionSimulator } from "./components/ExtensionSimulator";
import { ReputationLeaderboard } from "./components/ReputationLeaderboard";
import { BlacklistSection } from "./components/BlacklistSection";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"analyzer" | "blacklist" | "reporters" | "extension" | "contract">("analyzer");

  // Authentication State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Blacklist & Reputation Database States
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // AI Scanner States
  const [scanUrl, setScanUrl] = useState("https://metamusk-rewards-security.online/claim");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<UrlCheckResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Flag on blockchain queue state
  const [flagReason, setFlagReason] = useState("");
  const [isFlaggingOnChain, setIsFlaggingOnChain] = useState(false);
  const [flaggedSuccess, setFlaggedSuccess] = useState(false);

  // Load initial databases on bootstrap
  const fetchDatabases = async () => {
    setIsDbLoading(true);
    try {
      const resBlacklist = await fetch("/api/blacklist");
      const dataBlacklist = await resBlacklist.json();
      if (dataBlacklist.success) {
        setBlacklist(dataBlacklist.blacklist);
      }

      const resReporters = await fetch("/api/reporters");
      const dataReporters = await resReporters.json();
      if (dataReporters.success) {
        setReporters(dataReporters.reporters);
      }
    } catch (err) {
      console.error("Fail fetching databases:", err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  // Handle MetaMask Connection (Actual & Mocked fallback)
  const connectMetaMask = async () => {
    // Check if window.ethereum is available for real MetaMask integration
    const win = window as any;
    if (win.ethereum) {
      try {
        const accounts = await win.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
          return;
        }
      } catch (err) {
        console.warn("Wallet authorization declined, invoking high-fidelity client simulation.");
      }
    }

    // High fidelity secure simulation fallback
    const mockAddresses = [
      "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F8bf65539F2310F2859e77514120ec2c2D1efB"
    ];
    const chosen = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    setWalletAddress(chosen);
  };

  // Perform AI scan using Express API
  const handleUrlScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanUrl.trim()) return;

    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setFlaggedSuccess(false);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl })
      });
      const data = await response.json();
      if (data.success) {
        setScanResult(data.analysis);
        // Pre-fill flag reason based on classifications
        if (data.analysis.status !== "SAFE") {
          setFlagReason(`Fraudulent ${data.analysis.classification} template. AI Threat Analyzer reports high phishing probability of ${(data.analysis.probability * 100).toFixed(0)}%.`);
        } else {
          setFlagReason("");
        }
      } else {
        setScanError(data.error || "Analysis error");
      }
    } catch (err: any) {
      setScanError("Failed reaching server analtyics hub: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Upvote/Downvote Blacklist entries (Consensus engine)
  const handleBlacklistVote = async (id: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch("/api/blacklist/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, voteType })
      });
      const data = await response.json();
      if (data.success) {
        // Optimistically update state
        setBlacklist(prev => 
          prev.map(item => item.id === id ? {
            ...item,
            votesUp: voteType === 'up' ? item.votesUp + 1 : item.votesUp,
            votesDown: voteType === 'down' ? item.votesDown + 1 : item.votesDown,
            status: (voteType === 'down' && (item.votesDown + 1) > item.votesUp + 5) ? 'cleared' : item.status
          } : item)
        );
      }
    } catch (err) {
      console.error("Voting error:", err);
    }
  };

  // Solidity Smart Contract Flag submission proxying to Express API
  const submitFlagToBlockchain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;
    if (!walletAddress) {
      await connectMetaMask();
      return;
    }

    setIsFlaggingOnChain(true);
    try {
      // Simulate mining delays on the Geth/Solidity node
      await new Promise(resolve => setTimeout(resolve, 1500));

      const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
      
      const response = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: scanResult.url,
          flaggedBy: walletAddress,
          reason: flagReason || `Flagged on-chain: ${scanResult.classification} threats found.`,
          score: scanResult.safetyScore,
          txHash: txHash
        })
      });

      const data = await response.json();
      if (data.success) {
        setFlaggedSuccess(true);
        // Refresh databases
        setBlacklist(data.entry ? [data.entry, ...blacklist] : blacklist);
        if (data.reporters) setReporters(data.reporters);
      }
    } catch (err) {
      console.error("Verification mining failure:", err);
    } finally {
      setIsFlaggingOnChain(false);
    }
  };

  // Staking submission controller
  const handleReputationStaking = async (amount: number) => {
    if (!walletAddress) return;
    try {
      const response = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `Simulated Stake Node Verification for ${walletAddress.substring(0,8)}`,
          flaggedBy: walletAddress,
          reason: `Staked additional Sentry power nodes of ${amount} UTX tokens on contract vault.`,
          score: 100, // Valid code
        })
      });
      const data = await response.json();
      if (data.success && data.reporters) {
        setReporters(data.reporters);
      }
    } catch(err) {
      console.error("Staking synchronizer fail:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/5 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Top Navigation Bar Branding */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl shadow-[0_0_15px_rgba(0,209,255,0.25)] border border-cyan-400/30">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold font-display uppercase tracking-wider text-white text-glow-primary">
                Registry Safety Shield
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-cyan-400/10 text-cyan-400 font-mono border border-cyan-400/20 px-2 py-0.5 rounded-full uppercase font-bold">
                Web3
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400">Decentralized phishing audit directory & blockchain blacklist registry</p>
          </div>
        </div>

        {/* Global Stats indicators and Connect button */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono pr-2">
            <div>
              <span className="text-slate-500 gap-1 inline-flex items-center">
                <Globe className="w-3.5 h-3.5" /> Blacklisted Nodes:
              </span>{" "}
              <strong className="text-rose-400 font-bold">{blacklist.length}</strong>
            </div>
            <div>
              <span className="text-slate-500 gap-1 inline-flex items-center">
                <Cpu className="w-3.5 h-3.5" /> Guard Sentinels:
              </span>{" "}
              <strong className="text-cyan-400 font-bold">{reporters.length}</strong>
            </div>
          </div>

          {walletAddress ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400 font-semibold shadow">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</span>
            </div>
          ) : (
            <button
              onClick={connectMetaMask}
              id="top-btn-connect-wallet"
              className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white rounded-xl cursor-pointer shadow-md transition"
            >
              <Key className="w-3.5 h-3.5" /> Connect MetaMask
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Navigation tabs selector bar */}
 <div className="flex border-b border-slate-900 overflow-x-auto text-xs sm:text-sm font-semibold scrollbar-none gap-2.5 pb-2 pointer-events-auto" id="navigation-tabs-bar">
          <button
            onClick={() => setActiveTab("analyzer")}
            id="tab-analyzer"
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              activeTab === "analyzer" 
                ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.15)] font-bold text-glow-primary" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Cpu className="w-4 h-4" />
            AI Phishing Analyzer
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            id="tab-blacklist"
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              activeTab === "blacklist" 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(255,45,85,0.15)] font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <ShieldX className="w-4 h-4" />
            Decentralized Directory
          </button>
          <button
            onClick={() => setActiveTab("reporters")}
            id="tab-reporters"
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              activeTab === "reporters" 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(255,159,10,0.15)] font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Award className="w-4 h-4" />
            Reporter Reputation & Staking
          </button>
          <button
            onClick={() => setActiveTab("extension")}
            id="tab-extension"
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              activeTab === "extension" 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(112,0,255,0.15)] font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Browser Extension Simulator
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            id="tab-contract"
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              activeTab === "contract" 
                ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.15)] font-bold text-glow-primary" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <FileCode className="w-4 h-4" />
            URLBlacklist.sol
          </button>
        </div>

        {/* Tab Panel content area */}
        <div className="min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              
              {/* ANALYZER SYSTEM */}
              {activeTab === "analyzer" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="analyzer-main-grid">
                  
                  {/* Left Column URL lookup action form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 leading-none">
                          <Cpu className="w-5 h-5 text-indigo-400" /> Security AI Scan Core
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Evaluates lexical properties, typosquatting domain brand triggers, domain age and SSL settings using Gemini server models.
                        </p>
                      </div>

                      <form onSubmit={handleUrlScan} className="space-y-4">
                        <div className="space-y-1.5">
                          <label htmlFor="url-scan-input" className="block text-[10px] uppercase font-bold text-slate-500 font-mono">
                            Target Threat Network Endpoint
                          </label>
                          <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500 transition">
                            <span className="bg-slate-900 border-r border-slate-800 text-[10px] text-slate-500 px-3.5 py-2.5 font-semibold shrink-0 uppercase select-none flex items-center">
                              Target
                            </span>
                            <input
                              id="url-scan-input"
                              type="text"
                              value={scanUrl}
                              onChange={(e) => setScanUrl(e.target.value)}
                              placeholder="e.g. metamusk-rewards-security.online"
                              className="bg-transparent text-xs sm:text-sm text-slate-200 outline-none w-full px-3.5 py-2.5 font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isScanning || !scanUrl.trim()}
                          id="btn-scan-trigger"
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer capitalize transition-all duration-300 disabled:opacity-50 select-none flex items-center justify-center gap-2"
                        >
                          {isScanning ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white pr-0.5" />
                              <span>Interrogating Network Registry...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse shrink-0" />
                              <span>Run Comprehensive ML Checks</span>
                            </>
                          )}
                        </button>
                      </form>

                      {scanError && (
                        <div id="scan-error-boundary" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2 max-w-full">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <span className="font-mono">{scanError}</span>
                        </div>
                      )}
                    </div>

                    {/* How it works info panel */}
                    <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl space-y-3 text-slate-400 text-xs leading-relaxed">
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5 font-display uppercase tracking-tight">
                        <Info className="w-4 h-4 text-cyan-400" />
                        Reputation Consensus Protocol
                      </h4>
                      <p>
                        Our platform provides dual-tier defense. High confidence phishing claims are backed by <strong>staked blockchain indices</strong> running on solidity contracts.
                      </p>
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-500 font-mono">
                        <li>AI classifies phishing lexical variables</li>
                        <li>Stakeholder nodes vote and mine state registers</li>
                        <li>Browser extension shields target domains instantly</li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column Scan evaluation parameters */}
                  <div className="lg:col-span-3">
                    {isScanning ? (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center min-h-[380px]">
                        <div className="relative flex items-center justify-center">
                          <Cpu className="w-10 h-10 text-indigo-500 animate-bounce" />
                          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute"></div>
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <h4 className="font-bold text-white text-sm">Performing Smart Contract Registry & AI Lookup</h4>
                          <p className="text-xs text-slate-500">Querying registrar endpoints and analyzing homoglyph brand-mimicry indicators.</p>
                        </div>
                      </div>
                    ) : scanResult ? (
                      /* Scanned results present! */
                      <div id="scan-evaluation-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                        
                        {/* Status alert bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Target analyzed:</span>
                            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-1.5 mt-0.5 break-all max-w-[280px] sm:max-w-md">
                              {scanResult.url}
                            </h3>
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            <span className="text-right">
                              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Classification:</div>
                              <div className="text-xs font-bold text-slate-300 font-mono uppercase">{scanResult.classification}</div>
                            </span>
                            <div className={`px-4 py-2 rounded-xl text-xs font-bold border font-mono ${scanResult.status === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : scanResult.status === 'SUSPICIOUS' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'}`}>
                              {scanResult.status}
                            </div>
                          </div>
                        </div>

                        {/* Dial meters or status numbers */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Radial indicator / text score */}
                          <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Safety Rating</span>
                            <div className="relative flex items-center justify-center">
                              <span className={`text-3xl font-black font-display ${scanResult.safetyScore > 80 ? 'text-emerald-400' : scanResult.safetyScore > 40 ? 'text-amber-400' : 'text-rose-500'}`}>
                                {scanResult.safetyScore}%
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Score of 100 on ledger scale.</span>
                          </div>

                          <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Phishing Probability</span>
                            <div className="relative flex items-center justify-center">
                              <span className={`text-3xl font-black font-display ${scanResult.probability < 0.2 ? 'text-emerald-400' : scanResult.probability < 0.6 ? 'text-amber-400' : 'text-rose-500'}`}>
                                {(scanResult.probability * 100).toFixed(0)}%
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Risk potential evaluation coefficient.</span>
                          </div>

                          <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Reputation Modifier</span>
                            <div className="relative flex items-center justify-center">
                              <span className={`text-3xl font-black font-display ${scanResult.reputationImpact >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {scanResult.reputationImpact >= 0 ? "+" : ""}{scanResult.reputationImpact}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Validators score adjustments.</span>
                          </div>

                        </div>

                        {/* Analysis Report */}
                        <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                          <h4 className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-indigo-400" /> Executive AI Threat Analysis Report
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                            {scanResult.threatReport.replace(/\*\*/g, '').replace(/`/g, '')}
                          </p>
                        </div>

                        {/* Heuristic metadata info details */}
                        <div className="space-y-3">
                          <h4 className="text-xs uppercase font-bold font-mono tracking-wider text-slate-500">
                            Domain Registry Checkpoints
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between">
                              <span className="text-slate-500">Registrar Hub:</span>
                              <span className="text-white font-semibold truncate max-w-[130px]">{scanResult.domainDetails.registrar || "NameSilo LLC Proxy"}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between">
                              <span className="text-slate-500">SSL status:</span>
                              <span className="text-emerald-400 font-semibold">{scanResult.domainDetails.sslStatus || "HTTPS Certificate Secure"}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between">
                              <span className="text-slate-500">Domain Age:</span>
                              <span className="text-indigo-400 font-semibold">{scanResult.domainDetails.age || "Unknown creation threshold"}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between">
                              <span className="text-slate-500">Proxy Location:</span>
                              <span className="text-white font-semibold truncate max-w-[130px]">{scanResult.domainDetails.serverLocation || "Offshore Proxy CDN"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Triggered Indicators list */}
                        <div className="space-y-2">
                          <h4 className="text-xs uppercase font-bold font-mono tracking-wider text-slate-500">
                            Triggered Risk Indicators
                          </h4>
                          <div className="flex flex-col gap-2">
                            {scanResult.riskIndicators.map((ind, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-900/10 rounded-xl text-[11px] text-slate-300 transition-colors">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <span>{ind}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* BLOCKCHAIN SUBMISSION TRIGGER PANEL */}
                        {scanResult.status !== 'SAFE' && (
                          <div id="onchain-flag-panel" className="mt-6 p-5 border border-indigo-950/80 bg-indigo-950/10 rounded-2xl space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 border border-indigo-500/20 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <Coins className="w-5 h-5 animate-bounce" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">Publish Threat Blacklist on Decentralized Ledger</h4>
                                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                                  Your evaluations flagged malicious variables. Commit this URL hash on the <strong>Solidity Smart Contract</strong> registry to update independent node caches worldwide.
                                </p>
                              </div>
                            </div>

                            <form onSubmit={submitFlagToBlockchain} id="form-onchain-flag" className="space-y-4">
                              <div className="space-y-1.5">
                                <label htmlFor="flag-reason-input" className="block text-[10px] uppercase font-bold text-indigo-300 font-mono">
                                  Registry Reason Citation (Mined publicly)
                                </label>
                                <textarea
                                  id="flag-reason-input"
                                  rows={2}
                                  value={flagReason}
                                  onChange={(e) => setFlagReason(e.target.value)}
                                  placeholder="Clarify specific visual indicators like mimicking Metamask, or drainer gas spend prompts..."
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 p-3 rounded-xl text-xs font-mono outline-none resize-none"
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1">
                                <p className="text-[10px] text-slate-500 max-w-sm">
                                  Required Stake: <strong className="text-indigo-400">50 UTX</strong> tokens. Successful consensus reports award you <strong className="text-amber-400">+15 RP points</strong>.
                                </p>
                                
                                <button
                                  type="submit"
                                  disabled={isFlaggingOnChain || flaggedSuccess}
                                  id="btn-blockchain-mined"
                                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 select-none shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  {isFlaggingOnChain ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                      <span>Mining Transaction Tx Block...</span>
                                    </>
                                  ) : flaggedSuccess ? (
                                    <>
                                      <Check className="w-4 h-4 text-emerald-400" />
                                      <span>Mined Successfully!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 text-indigo-300" />
                                      <span>Flag on Block & Stake 50 UTX</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>

                            {flaggedSuccess && (
                              <div id="flag-onchain-success-msg" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 font-mono text-xs">
                                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" /> Smart Contract Registry Updated
                                </div>
                                <p className="text-slate-400 text-[10px] leading-relaxed">
                                  URL successfully blacklisted in Solidity contract database snapshot. Extension background listeners synced! Check the <strong>Decentralized Directory</strong> tab to view.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Zero state / awaiting search lookups */
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-3 min-h-[385px]" id="scan-instructions-panel">
                        <Cpu className="w-12 h-12 text-slate-700 animate-pulse" />
                        <h4 className="text-slate-400 font-bold text-sm">Security AI Interrogation Sentry</h4>
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                          Submit an active address above to retrieve algorithmic risk parameters, registrar status, and domain attributes instantly.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* BLACKLIST DIRECTORY */}
              {activeTab === "blacklist" && (
                <BlacklistSection 
                  blacklist={blacklist} 
                  onVote={handleBlacklistVote}
                  isLoading={isDbLoading} 
                />
              )}

              {/* REPUTATION AND STAKING */}
              {activeTab === "reporters" && (
                <ReputationLeaderboard 
                  reporters={reporters} 
                  currentAddress={walletAddress}
                  onConnectWallet={connectMetaMask} 
                  onStakeTokens={handleReputationStaking} 
                />
              )}

              {/* BROWSER EXTENSION HUB */}
              {activeTab === "extension" && (
                <ExtensionSimulator 
                  blacklist={blacklist} 
                  aiVerify={async (url: string) => {
                    try {
                      const response = await fetch("/api/analyze-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url })
                      });
                      return await response.json();
                    } catch(err) {
                      return { success: false };
                    }
                  }} 
                />
              )}

              {/* SOLIDITY CODE */}
              {activeTab === "contract" && (
                <SmartContractInspector />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Page unified footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
        <div>
          <span>&copy; {new Date().getFullYear()} Blockchain URL Safety Checker</span>
          <span className="text-slate-700 ml-1">|</span>
          <span className="text-slate-600 ml-1">MERN Solidity sandbox environment</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600">Local Time: 2026-05-23 (UTC)</span>
          <span className="text-slate-700">|</span>
          <span>Security Protocol v1.4</span>
        </div>
      </footer>
    </div>
  );
}
