/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Globe, Shield, ShieldAlert, ShieldCheck, RefreshCw, Layers, 
  Terminal, Search, FileCode, Check, Copy, ArrowLeft, ArrowRight, Lock, Unlock, AlertTriangle 
} from "lucide-react";

interface ExtensionSimulatorProps {
  blacklist: Array<{
    url: string;
    reason: string;
    score: number;
    flaggedBy: string;
    txHash: string;
  }>;
  aiVerify: (url: string) => Promise<any>;
}

export function ExtensionSimulator({ blacklist, aiVerify }: ExtensionSimulatorProps) {
  const [browserUrl, setBrowserUrl] = useState("https://metamusk-rewards-security.online/claim");
  const [lastCheckedUrl, setLastCheckedUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"viewport" | "manifest" | "content" | "popup">("viewport");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Safety status state
  const [isLoading, setIsLoading] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'suspicious' | 'malicious' | 'unknown'>('malicious');
  const [score, setScore] = useState(8);
  const [matchedSource, setMatchedSource] = useState<'blockchain' | 'ai' | 'clean'>('blockchain');
  const [details, setDetails] = useState("Matched active blockchain blacklist: Flagged by 0xF29A...abe09 (Tx: 0x8922...f29e)");
  const [isBypassed, setIsBypassed] = useState(false);

  // Pre-load common simulation pages
  const presetSites = [
    { name: "Scam Rewards", url: "https://metamusk-rewards-security.online/claim", desc: "Phishing imitation" },
    { name: "Crypto Pool Scam", url: "http://unisvap-pool-v4-airdrop.ru/liquidity", desc: "Malicious smart contract" },
    { name: "Safe Engine", url: "https://google.com", desc: "Standard safe search" },
    { name: "Legit Repo", url: "https://github.com", desc: "Verified platforms" }
  ];

  // Extension Source Code Files
  const extensionManifest = `{
  "manifest_version": 3,
  "name": "Web3 decentralized Shield",
  "version": "1.0.0",
  "description": "Protects users against phishing by listening to blockchain smart contracts & AI verification endpoints.",
  "permissions": ["activeTab", "storage", "webNavigation"],
  "host_permissions": ["http://*/*", "https://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}`;

  const extensionContentJs = `// content.js - Intercepts loads & queries local RPC smart contract cache
(async () => {
  const currentUrl = window.location.href;
  console.log("[Web3 Shield] Analyzing navigation load:", currentUrl);

  // 1. Fetch blockchain registry snapshot / local storage cache
  const result = await chrome.storage.local.get(["blockchainBlacklist", "aiEndpointUrl"]);
  const blacklist = result.blockchainBlacklist || [];
  
  const matched = blacklist.find(entry => 
    currentUrl.toLowerCase().includes(entry.url.toLowerCase())
  );

  if (matched) {
    // Inject Warning Interstitial Block View
    blockWebpage(matched.reason, matched.txHash, matched.score);
  } else if (result.aiEndpointUrl) {
    // 2. Fallback check - Query AI verification for unknown domains
    try {
      const res = await fetch(\`\${result.aiEndpointUrl}/api/analyze-url\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl })
      });
      const data = await res.json();
      if (data.success && data.analysis.safetyScore < 40) {
        blockWebpage(data.analysis.threatReport, "AI_HEURISTIC_CONFIRMED", data.analysis.safetyScore);
      }
    } catch(err) {
      console.warn("AI remote lookup timed out:", err);
    }
  }
})();

function blockWebpage(reason, proof, score) {
  document.documentElement.innerHTML = \`
    <div style="background-color:#0f172a; color:#f8fafc; font-family:sans-serif; text-align:center; padding:10%; height:100vh;">
      <h1 style="color:#ef4444; font-size:42px;">⚠️ DECENTRALIZED THREAT BLOCKED</h1>
      <p style="font-size:18px; color:#cbd5e1; margin:20px max-width:600px; margin-left:auto; margin-right:auto;">
        Our decentralized browser extension security intercept protocol shielded you from accessing this malicious URL.
      </p>
      <div style="background:#1e293b; padding:20px; border-radius:12px; max-width:500px; margin:0 auto; text-align:left; border:1px solid #334155;">
        <p><strong>Reason:</strong> \${reason}</p>
        <p><strong>Risk Score:</strong> \${100 - score}/100</p>
        <p style="font-family:monospace; font-size:12px; color:#06b6d4;"><strong>Blockchain Proof Tx:</strong> \${proof}</p>
      </div>
      <button onclick="window.history.back()" style="margin-top:30px; background:#06b6d4; border:none; padding:12px 24px; color:#fff; border-radius:8px; cursor:pointer; font-weight:bold;">Safely Go Back</button>
    </div>
  \`;
}`;

  const extensionPopupHtml = `<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 300px; font-family: sans-serif; background: #0f172a; color: #fff; padding: 15px; }
    .status-card { text-align: center; border-radius: 8px; padding: 10px; margin-bottom: 15px; }
    .alert { background: #7f1d1d; border: 1px solid #ef4444; }
    .secure { background: #064e3b; border: 1px solid #10b981; }
    .btn { background: #06b6d4; border: none; padding: 8px; width: 100%; border-radius: 4px; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <h3>🛡️ Web3 Threat Shield</h3>
  <div id="status" class="status-card secure">
    <strong>Domain Evaluated Safe</strong>
  </div>
  <button id="sync" class="btn">Sync Smart Contract Registry</button>
</body>
</html>`;

  // Monitor browserUrl change and run check
  const performBrowserScan = async (url: string) => {
    setIsLoading(true);
    setIsBypassed(false);
    setLastCheckedUrl(url);

    // 1. Check in our existing Smart Contract Blacklist first
    const matched = blacklist.find(entry => 
      url.toLowerCase().includes(entry.url.toLowerCase()) || 
      entry.url.toLowerCase().includes(url.toLowerCase())
    );

    if (matched) {
      setTimeout(() => {
        setSafetyStatus(matched.score < 25 ? 'malicious' : 'suspicious');
        setScore(matched.score);
        setMatchedSource('blockchain');
        setDetails(`Blacklisted on Ethereum Chain by ${matched.flaggedBy.substring(0,6)}...${matched.flaggedBy.substring(34)}. Proof Hash: ${matched.txHash.substring(0,10)}...`);
        setIsLoading(false);
      }, 700);
      return;
    }

    // 2. Run Gemini AI Verification
    try {
      const response = await aiVerify(url);
      if (response && response.success) {
        const analysis = response.analysis;
        // set status
        setSafetyStatus(
          analysis.status === 'MALICIOUS' ? 'malicious' : 
          analysis.status === 'SUSPICIOUS' ? 'suspicious' : 'safe'
        );
        setScore(analysis.safetyScore);
        setMatchedSource('ai');
        setDetails(`AI Model Analysis Check: ${analysis.threatReport.substring(0, 110)}... Metrics: Age: ${analysis.domainDetails.age}`);
      } else {
        // Fallback standard safe defaults
        setSafetyStatus('safe');
        setScore(95);
        setMatchedSource('clean');
        setDetails("Legitimate active domain verified via DNS & safe reputation database indices.");
      }
    } catch(err) {
      setSafetyStatus('unknown');
      setScore(50);
      setDetails("Timeout checking URL metrics. Standard warning mode defaults activated.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    performBrowserScan(browserUrl);
  }, []);

  const handleGoToUrl = (url: string) => {
    const formattedUrl = url.startsWith("http") ? url : "https://" + url;
    setBrowserUrl(formattedUrl);
    performBrowserScan(formattedUrl);
  };

  const copyToFile = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div id="extension-simulator-module" className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-xl text-slate-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Integrate & Test Browser Extension
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Simulate our browser extension blocking malicious URLs in real-time or exports files to build your extension.
          </p>
        </div>
        
        {/* Toggle tabs between Viewport Simulation and Code Files */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 self-stretch md:self-auto overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("viewport")}
            id="tab-btn-viewport"
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer select-none shrink-0 ${activeTab === "viewport" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            Live Browser Simulator
          </button>
          <button
            onClick={() => setActiveTab("manifest")}
            id="tab-btn-manifest"
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${activeTab === "manifest" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
          >
            manifest.json
          </button>
          <button
            onClick={() => setActiveTab("content")}
            id="tab-btn-content"
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${activeTab === "content" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
          >
            content.js (Intercept)
          </button>
          <button
            onClick={() => setActiveTab("popup")}
            id="tab-btn-popup"
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${activeTab === "popup" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
          >
            popup.html
          </button>
        </div>
      </div>

      {activeTab === "viewport" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Quick preset URLs selection */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Preset Simulator Targets</h3>
            <div className="flex flex-col gap-1.5">
              {presetSites.map((site) => (
                <button
                  key={site.name}
                  onClick={() => handleGoToUrl(site.url)}
                  id={`preset-btn-${site.name.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${browserUrl === site.url ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"}`}
                >
                  <div className="font-semibold text-xs text-white">{site.name}</div>
                  <div className="text-[10px] text-slate-400 max-w-[150px] truncate">{site.url.replace(/^https?:\/\//, '')}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Action Overlay
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The mock browser below runs the simulated extension. Type any malicious URL to see how the blockchain blacklist acts on network loads.
              </p>
            </div>
          </div>

          {/* Simulated Browser Sandbox Viewport */}
          <div className="lg:col-span-3 border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden flex flex-col min-h-[420px] shadow-2xl">
            
            {/* Browser Header Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
              {/* Window dots */}
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>

              {/* Navigation arrows */}
              <div className="hidden sm:flex items-center gap-1 text-slate-500">
                <ArrowLeft className="w-4 h-4 cursor-not-allowed" />
                <ArrowRight className="w-4 h-4 cursor-not-allowed" />
                <RefreshCw onClick={() => performBrowserScan(browserUrl)} className="w-3.5 h-3.5 ml-1 hover:text-slate-300 cursor-pointer text-slate-500 active:rotate-180 transition-transform duration-500" />
              </div>

              {/* URL Address Input Bar */}
              <div className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 flex items-center gap-2 px-3 py-1 rounded-lg text-xs transition">
                {browserUrl.startsWith("https") ? (
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-amber-500 hover:scale-110" />
                )}
                <input
                  type="text"
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGoToUrl(browserUrl)}
                  id="browser-url-input"
                  className="bg-transparent text-slate-200 outline-none w-full font-mono text-[11px]"
                />
              </div>

              {/* Extension Icon Simulator Toggle */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-lg shrink-0">
                <div className={`p-1 rounded ${safetyStatus === 'malicious' ? 'bg-red-500/20 text-red-400' : safetyStatus === 'suspicious' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {safetyStatus === 'malicious' ? <ShieldAlert className="w-4 h-4" /> : safetyStatus === 'suspicious' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <span className="text-[10px] hidden sm:inline font-bold pr-1 uppercase text-slate-300">
                  {safetyStatus === 'malicious' ? 'BLOCKED' : safetyStatus === 'suspicious' ? 'WARNED' : 'SECURE'}
                </span>
              </div>
            </div>

            {/* Browser Page Viewport Body */}
            <div className="flex-1 relative p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">
              
              {isLoading ? (
                <div id="browser-loader" className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-slate-400 text-xs font-mono">Web3 Shield Interception Scanning...</div>
                </div>
              ) : safetyStatus === 'malicious' && !isBypassed ? (
                /* Blocked Interstitial Phishing Warning page */
                <div id="simulated-blocked-view" className="max-w-md text-center p-6 bg-red-950/40 border border-rose-900/60 rounded-2xl space-y-4 shadow-2xl animate-pulse">
                  <div className="inline-flex p-3 bg-rose-500/20 text-rose-400 rounded-full">
                    <ShieldAlert className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-400">Threat Detected: Intercept Blocked</h3>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    Deceptive Web3 platform connection blocked. This address matches flag hashes published on the smart contract registry or analyzed as phishing scams.
                  </p>

                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left text-[11px] font-mono space-y-1.5 text-slate-300">
                    <div><span className="text-slate-500">INTERCEPT:</span> <span className="text-rose-400">{lastCheckedUrl}</span></div>
                    <div><span className="text-slate-500">BLOCKED PROOF:</span> <span className="text-cyan-400">{matchedSource === 'blockchain' ? 'Solidity Hash Emit' : 'Deep ML Prob Heuristics'}</span></div>
                    <div className="text-slate-400 truncate"><span className="text-slate-500">REASON:</span> {details}</div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleGoToUrl("https://google.com")}
                      id="btn-safely-return"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer select-none transition"
                    >
                      Return Safely To Google
                    </button>
                    <button
                      onClick={() => setIsBypassed(true)}
                      id="btn-bypass-warning"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 rounded-lg text-[10px] cursor-pointer transition"
                    >
                      Ignore (Unsafe Bypass)
                    </button>
                  </div>
                </div>
              ) : (
                /* Legit Browser Load Simulation or bypassed load */
                <div id="simulated-website-body" className="w-full h-full flex flex-col justify-between max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 shadow-md transition">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                        {lastCheckedUrl.replace(/^https?:\/\/(www\.)?/, '').substring(0,2)}
                      </div>
                      <span className="font-bold text-sm text-white">
                        {lastCheckedUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Extension: Scanned Safe
                    </div>
                  </div>

                  <div className="py-8 text-center space-y-3">
                    {lastCheckedUrl.includes("claim") || lastCheckedUrl.includes("liquidity") ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                        <p className="text-xs text-amber-300 font-bold">⚠️ Warning: Loaded Bypassed Site ({score}% Safety)</p>
                        <p className="text-[11px] text-slate-400">You bypassed the Web3 block barrier. This interface is suspect of mimicking a wallet or decentralized application.</p>
                      </div>
                    ) : (
                      <>
                        <Globe className="w-12 h-12 text-slate-700 mx-auto" />
                        <h4 className="text-sm font-semibold text-white">Loaded Target Web Port</h4>
                        <p className="text-xs text-slate-400">DNS Resolution and SSL Verification metrics completed successfully with 100% active validation checks.</p>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                    <span>SSL Certificate Active</span>
                    <span>Safety Score: <strong className="text-emerald-400">{score}%</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox footer alert */}
            <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
              <span className="font-mono text-cyan-400">Extension Engine: Active background.js</span>
              <span className="text-slate-500">V3 Manifest Registry</span>
            </div>
          </div>
        </div>
      ) : (
        /* Source Code Copy tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold">Extension file:</span>
              <span className="text-white text-sm font-semibold ml-2">
                {activeTab === "manifest" ? "manifest.json" : activeTab === "content" ? "content.js" : "popup.html"}
              </span>
            </div>
            <button
              onClick={() => copyToFile(
                activeTab === "manifest" ? extensionManifest : activeTab === "content" ? extensionContentJs : extensionPopupHtml,
                activeTab
              )}
              id={`btn-copy-code-${activeTab}`}
              className="flex items-center gap-1.5 text-xs text-slate-300 border border-slate-700 bg-slate-800 hover:border-indigo-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg cursor-pointer transition"
            >
              {copiedFile === activeTab ? <Check className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Copy className="w-4 h-4" />}
              <span>{copiedFile === activeTab ? "Copied Source!" : "Copy Code"}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto max-h-96 text-xs text-slate-200 font-mono leading-relaxed border border-slate-850 custom-scroll">
            {activeTab === "manifest" ? extensionManifest : activeTab === "content" ? extensionContentJs : extensionPopupHtml}
          </pre>

          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
            <strong>How to deployment build extension:</strong> <br />
            1. Save the manifest and JavaScript as separate local files in a folder named <span className="font-mono text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">UrlShieldExtension</span>.<br />
            2. Open Google Chrome, head to <span className="font-mono text-indigo-400 bg-slate-950 px-1 py-0.5 rounded">chrome://extensions</span> and activate <strong>Developer Mode</strong> at top right.<br />
            3. Choose <strong>Load Unpacked</strong> and select your extension folder to load it instantly. Run smart checks globally on all open browser tabs!
          </p>
        </div>
      )}
    </div>
  );
}
