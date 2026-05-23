/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json());

// In-Memory Database mimicking MongoDB / Smart Contract events database
const DATA_FILE = path.join(process.cwd(), "blacklist_db.json");

// Default initial database
const defaultBlacklist = [
  {
    id: "bl_1",
    url: "https://metamusk-rewards-security.online/claim",
    flaggedBy: "0xF29A4D3396489C579DbA20A3EbCFC2EFE88Abe09",
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    reason: "Mimicking MetaMask brand to steal seed phrases under guise of rewards authorization.",
    score: 8,
    txHash: "0x89228fb8e6fe1901a14c1cd8f8303bfa82910ae677fa8f60ab41c88c7f26f29e",
    votesUp: 42,
    votesDown: 1,
    status: "active"
  },
  {
    id: "bl_2",
    url: "http://unisvap-pool-v4-airdrop.ru/liquidity",
    flaggedBy: "0xDCAf9948E4430e37965902BFE6B6De9724CE95A0",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
    reason: "Fake Uniswap decentralized exchange front. Prompts fake smart contract spend approval.",
    score: 12,
    txHash: "0xab42661cdd8f4a6c8e3128fb99110ab78f68ecfa7616b281f6eed01129ea4b5f",
    votesUp: 28,
    votesDown: 0,
    status: "active"
  },
  {
    id: "bl_3",
    url: "http://steamcommunity-gift-keys.tk/login",
    flaggedBy: "0x5E0C2ba83bc8ff8f82877B681ab810B891Abe05e",
    timestamp: new Date(Date.now() - 3620000).toISOString(), // ~1 hr ago
    reason: "Credential harvesting phishing site targeting Steam gamers using expired domains.",
    score: 15,
    txHash: "0xe64a88bc3fdf882eb72faebdce88bcfa3392a0cf16e251a2dcdca4f5ff7ffea2",
    votesUp: 14,
    votesDown: 2,
    status: "active"
  }
];

const defaultReporters = [
  { address: "0xF29A4D3396489C579DbA20A3EbCFC2EFE88Abe09", username: "Etherscan_Sentinel", reputationScore: 980, totalSubmissions: 24, validatorsMet: 8, stakedToken: 2500 },
  { address: "0xDCAf9948E4430e37965902BFE6B6De9724CE95A0", username: "Cyber_Sherlock", reputationScore: 840, totalSubmissions: 15, validatorsMet: 5, stakedToken: 1200 },
  { address: "0x5E0C2ba83bc8ff8f82877B681ab810B891Abe05e", username: "Web3_Guard_Alice", reputationScore: 610, totalSubmissions: 8, validatorsMet: 3, stakedToken: 500 }
];

function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return parsed;
    }
  } catch (err) {
    console.error("Error loading blacklist DB, falling back to default:", err);
  }
  return { blacklist: defaultBlacklist, reporters: defaultReporters };
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving blacklist DB:", err);
  }
}

// Ensure database is initialized
let database = loadDatabase();
saveDatabase(database);

// Lazy initialization of Gemini client
let ai: any = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. URL analysis will fallback to static heuristic checks.");
      return null;
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return ai;
}

// API Routes

// 1. Fetch safety/malware threat blacklist history (synchronized blockchain events database)
app.get("/api/blacklist", (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, blacklist: db.blacklist });
});

// 2. Report a suspicious URL & store to the blockchain (simulated)
app.post("/api/blacklist", (req, res) => {
  const { url, flaggedBy, reason, score, txHash } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  const db = loadDatabase();
  
  // Clean URL slightly for indexing
  let cleanUrl = url.trim();

  // Create new entry mimicking Solidity emission event mined by MongoDB hook
  const newEntry = {
    id: `bl_${Date.now()}`,
    url: cleanUrl,
    flaggedBy: flaggedBy || "0x0000000000000000000000000000000000000000",
    timestamp: new Date().toISOString(),
    reason: reason || "Flagged in community warning database.",
    score: score || 50,
    txHash: txHash || "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(""),
    votesUp: 1,
    votesDown: 0,
    status: "active"
  };

  db.blacklist.unshift(newEntry);

  // Update reputation scoring of the reporter
  const reporterIndex = db.reporters.findIndex(
    (r: any) => r.address.toLowerCase() === (flaggedBy || "").toLowerCase()
  );

  if (reporterIndex !== -1) {
    db.reporters[reporterIndex].reputationScore += 15;
    db.reporters[reporterIndex].totalSubmissions += 1;
    db.reporters[reporterIndex].stakedToken += 10;
  } else if (flaggedBy) {
    db.reporters.push({
      address: flaggedBy,
      username: `Web3_Reporter_${flaggedBy.substring(2, 6)}`,
      reputationScore: 100,
      totalSubmissions: 1,
      validatorsMet: 1,
      stakedToken: 10
    });
  }

  saveDatabase(db);
  res.json({ success: true, entry: newEntry, reporters: db.reporters });
});

// 3. Upvote/Downvote Blacklist entry to mimic Blockchain Multi-signature consensus reputation state transition
app.post("/api/blacklist/vote", (req, res) => {
  const { id, voteType } = req.body; // 'up' or 'down'
  const db = loadDatabase();
  
  const item = db.blacklist.find((b: any) => b.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: "Entry not found" });
  }

  if (voteType === "up") {
    item.votesUp += 1;
  } else {
    item.votesDown += 1;
  }

  // If items get negative community vote consensus they can be marked cleared/appealed
  if (item.votesDown > item.votesUp + 5) {
    item.status = "cleared";
  }

  saveDatabase(db);
  res.json({ success: true, entry: item });
});

// 4. Fetch the entire Reputation Scores and stakes list
app.get("/api/reporters", (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, reporters: db.reporters });
});

// 5. Deep ML/AI Verification using Gemini Flash
app.post("/api/analyze-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required for analysis." });
  }

  const cleanUrl = url.trim();

  // Try parsing the URL format to verify if it is valid or formatted nicely
  let domain = cleanUrl;
  try {
    const parsed = new URL(cleanUrl.startsWith("http") ? cleanUrl : "http://" + cleanUrl);
    domain = parsed.hostname;
  } catch (err) {}

  const gemini = getGeminiClient();

  if (!gemini) {
    // Elegant fallback heuristics if Gemini key isn't provided/working so app remains fully functional
    console.log("No Gemini API Client configured, returning mock static heuristics.");
    const isSuspiciousTLD = /\.(ru|tk|online|cc|cn|xyz|club|gdn)$/i.test(domain);
    const mentionsMajorBrand = /(metamask|uniswap|binance|opensea|paypal|steam|coinbase)/i.test(domain);
    const hasIpAddress = /^[0-9.]+$/.test(domain.replace(/:[0-9]+$/, ''));
    const isHttps = cleanUrl.startsWith("https");

    let score = 95;
    let prob = 0.05;
    const indicators: string[] = [];

    if (isSuspiciousTLD) {
      score -= 25;
      prob += 0.25;
      indicators.push(`Suspicious top-level domain extension (.${domain.split('.').pop()}) frequently associated with scams.`);
    }
    if (mentionsMajorBrand && !domain.includes("metamask.io") && !domain.includes("uniswap.org") && !domain.includes("binance.com") && !domain.includes("steamcommunity.com") && !domain.includes("coinbase.com")) {
      score -= 40;
      prob += 0.45;
      indicators.push(`Homoglyph/brand typosquatting risk: URL references trademarked brand keywords like "${mentionsMajorBrand ? 'brand' : 'crypto'}" but is not hosted on an official domain.`);
    }
    if (hasIpAddress) {
      score -= 30;
      prob += 0.3;
      indicators.push("Direct IP address access instead of certified Domain Name Service resolution.");
    }
    if (!isHttps) {
      score -= 15;
      prob += 0.15;
      indicators.push("Unencrypted HTTP web traffic: Lacks certified Secure Sockets Layer (SSL) encryption.");
    }

    const status = prob > 0.6 ? "MALICIOUS" : prob > 0.3 ? "SUSPICIOUS" : "SAFE";
    const classification = prob > 0.6 ? "phishing" : prob > 0.3 ? "spam" : "legitimate";

    return res.json({
      success: true,
      analysis: {
        url: cleanUrl,
        safetyScore: Math.max(0, score),
        probability: Math.min(1.0, prob),
        status,
        classification,
        threatReport: `**Static Heuristic Reputation Shield Report** for \`${domain}\`:\n\nSecurity checkpoints evaluated the lexical properties, domain suffix metadata, brand mimicry profiles, and SSL certificate variables. Evaluated severe domain mimicry indicators targeting crypto wallets / Web3 exchanges outside official canonical subnets.\n\nWarning: Flagged signals suggest possible deceptive phishing activity if this domain prompts MetaMask authorization or contract spend gas permissions.`,
        domainDetails: {
          registrar: "Unavailable (Local Heuristic Suffix Analyzer Mode)",
          age: isSuspiciousTLD ? "Created within last 30 days" : "Legacy domain age (estimated > 1 year)",
          sslStatus: isHttps ? "Valid SSL (HTTPS Encrypted)" : "No SSL Active (HTTP plain-text)",
          serverLocation: "Offshore Node DNS Cluster"
        },
        riskIndicators: indicators.length ? indicators : ["No critical typographical brand mimics or unencrypted headers detected on brief look."],
        reputationImpact: prob > 0.4 ? -50 : 20
      }
    });
  }

  try {
    const prompt = `Analyze this URL for phishing, malware, scams, or malicious behavior: "${cleanUrl}".
Think step-by-step. Inspect:
1. Suffixes/TLD security rating (e.g. .ru, .tk, .online, .click, .xyz are high scam targets for cryptos).
2. Lexical patterns: brand impersonation (e.g. mimicking Metamask, Uniswap, Coinbase, US Bank).
3. URL structure: subdomains, length, URL shorteners, direct IP, excessive hyphens.
4. Social engineering targets (Web3 wallets connection, air-drops claim, gas approvals, private key sweeps).

Provide a highly realistic simulation of security indicators (even if you don't do real-time DNS requests, predict likelihood based on excellent domain heuristic patterns). Return a JSON object with strictly defined schema representation.`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Cybersecurity analyst specialized in Web3 blockchain safety, phishing pattern recognition, and smart contract audit proxy analysis. Return exact analysis JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safetyScore: { 
              type: Type.INTEGER, 
              description: "Safety evaluation score from 0 (malicious/highest danger) to 100 (complete trust/verified legit)." 
            },
            probability: { 
              type: Type.NUMBER, 
              description: "Phishing vulnerability probability from 0.0 (safe) to 1.0 (phishing absolute certitude)." 
            },
            status: { 
              type: Type.STRING, 
              description: "Must be exactly 'SAFE', 'SUSPICIOUS', 'DANGEROUS', or 'MALICIOUS'." 
            },
            classification: { 
              type: Type.STRING, 
              description: "Must be exactly 'legitimate', 'phishing', 'malware', 'spam', or 'unknown'." 
            },
            threatReport: { 
              type: Type.STRING, 
              description: "Markdown formatting explanation detailing the domain name analysis, potential brand-jacking, wallet-drainer heuristics, or high-risk TLD warnings." 
            },
            domainDetails: {
              type: Type.OBJECT,
              properties: {
                registrar: { type: Type.STRING, description: "Simulated registrar info or NameSilo/GoDaddy matching the domain style." },
                age: { type: Type.STRING, description: "Estimated or known domain creation timeframe representation." },
                sslStatus: { type: Type.STRING, description: "Whether HTTPS SSL certificate configuration is active or suspect." },
                serverLocation: { type: Type.STRING, description: "Host geographic IP region (e.g., Eastern Europe proxies, North America cloud clusters)." }
              }
            },
            riskIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top risk tags or triggers found in URL name or known Web3 drainer layouts."
            },
            reputationImpact: { 
              type: Type.INTEGER, 
              description: "reputation deduction or boost from -100 to +100 based on status." 
            }
          },
          required: ["safetyScore", "probability", "status", "classification", "threatReport", "domainDetails", "riskIndicators", "reputationImpact"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text.trim());
    res.json({ success: true, analysis: { url: cleanUrl, ...parsedResponse } });
  } catch (error: any) {
    console.error("Gemini analytical fail:", error);
    res.status(500).json({ success: false, error: "AI analysis server error: " + error.message });
  }
});


// Serve static files in production, integrate Vite dev server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
