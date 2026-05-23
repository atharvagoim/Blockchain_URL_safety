/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Award, ShieldCheck, Key, Coins, UserCheck, Plus, Check, ArrowUpRight, TrendingUp 
} from "lucide-react";
import { Reporter } from "../types";

interface ReputationLeaderboardProps {
  reporters: Reporter[];
  currentAddress: string | null;
  onConnectWallet: () => void;
  onStakeTokens: (amount: number) => void;
}

export function ReputationLeaderboard({ 
  reporters, 
  currentAddress, 
  onConnectWallet, 
  onStakeTokens 
}: ReputationLeaderboardProps) {
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [stakingSuccess, setStakingSuccess] = useState(false);

  // Identify if current wallet is in reporters database
  const currentReporter = reporters.find(
    r => r.address.toLowerCase() === (currentAddress || "").toLowerCase()
  );

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stakeAmount <= 0) return;
    onStakeTokens(stakeAmount);
    setStakingSuccess(true);
    setTimeout(() => setStakingSuccess(false), 3000);
  };

  return (
    <div id="reputation-leaderboard-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-lg text-slate-300 space-y-6">
      
      {/* Reputation Title & Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Web3 Reporter Reputation & Staking
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Stake testnet UTX tokens to back threat assessments, validate suspicious links, & earn rewards.
          </p>
        </div>

        {currentAddress ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Connected: {currentAddress.substring(0, 6)}...{currentAddress.substring(38)}</span>
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            id="btn-reputation-connect-wallet"
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer"
          >
            <Key className="w-4 h-4 text-indigo-200" />
            Connect MetaMask Wallet
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Table Column */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Guild Leaderboard</h3>
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Sentinel Reporter</th>
                  <th className="p-3">Rep Score</th>
                  <th className="p-3">Submissions</th>
                  <th className="p-3">Staked Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 leading-relaxed font-mono">
                {reporters
                  .sort((a, b) => b.reputationScore - a.reputationScore)
                  .map((rep, idx) => {
                    const isSelf = currentAddress && rep.address.toLowerCase() === currentAddress.toLowerCase();
                    return (
                      <tr 
                        key={rep.address} 
                        id={`row-rep-${rep.address.substring(2,6)}`}
                        className={`hover:bg-slate-900/30 transition-colors ${isSelf ? "bg-indigo-950/20 text-indigo-300 font-bold" : ""}`}
                      >
                        <td className="p-3 text-center text-slate-500 font-bold">#{idx + 1}</td>
                        <td className="p-3 flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${isSelf ? "bg-indigo-500 text-white border-indigo-400" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
                            {rep.username.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-white font-semibold flex items-center gap-1.5">
                              {rep.username}
                              {isSelf && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.2 rounded font-sans uppercase">You</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{rep.address}</div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-amber-400">
                          {rep.reputationScore} RP
                        </td>
                        <td className="p-3 text-slate-400">
                          {rep.totalSubmissions}
                        </td>
                        <td className="p-3 text-slate-300 text-right pr-6 font-semibold">
                          {rep.stakedToken.toLocaleString()} <span className="text-indigo-400 text-[10px]">UTX</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staking & Utility Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Staking Node Dashboard</h3>

          {currentAddress ? (
            <div className="bg-slate-950/80 p-5 border border-slate-800 rounded-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                <span className="text-xs text-slate-400">Sentinel Level:</span>
                <span className="text-xs font-bold text-white uppercase bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
                  {currentReporter ? (currentReporter.reputationScore > 500 ? "Gold Shield" : "Bronze Sentry") : "Novice"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-500">Your RP</div>
                  <div className="text-sm font-bold text-amber-400 mt-1">{currentReporter?.reputationScore || 100} RP</div>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-500">Staked Yield</div>
                  <div className="text-sm font-bold text-indigo-400 mt-1">{currentReporter?.stakedToken || 10} UTX</div>
                </div>
              </div>

              {/* Stake input submission */}
              <form onSubmit={handleStakeSubmit} className="space-y-3">
                <label htmlFor="stake-token-input" className="block text-[10px] uppercase font-bold text-slate-500">
                  Collateralize Sentry Stake Node
                </label>
                <div className="flex gap-2">
                  <div className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-1.5 flex-1 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-indigo-400" />
                    <input
                      id="stake-token-input"
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      className="bg-transparent text-white outline-none w-full text-xs font-bold font-mono"
                      min="10"
                      max="10000"
                    />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">UTX</span>
                  </div>
                  <button
                    type="submit"
                    id="btn-submit-stake"
                    className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer text-center"
                  >
                    Stake
                  </button>
                </div>
                {stakingSuccess && (
                  <div id="stake-success-msg" className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" />
                    Transaction mined on blockchain! Node Staked.
                  </div>
                )}
              </form>

              <div className="text-[11px] text-slate-400 leading-relaxed space-y-1 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                <h4 className="font-semibold text-white text-xs flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Mining Rewards Program:
                </h4>
                <p>Every time a URL you flagged is verified malicious by decentralized votes, you receive <strong className="text-indigo-400">15 RP points</strong> and a reward dividend pool payout.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 p-6 border border-slate-800 rounded-xl text-center flex flex-col items-center justify-center space-y-3 min-h-[180px]">
              <UserCheck className="w-8 h-8 text-slate-600" />
              <div className="text-white font-bold text-sm">Account Not Synchronized</div>
              <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                Connect your browser Web3 signature utility to enable blockchain node staking rewards.
              </p>
              <button
                onClick={onConnectWallet}
                id="btn-stake-connect-wallet"
                className="text-xs font-semibold px-4 py-2 border border-slate-700 hover:border-indigo-400 hover:text-indigo-400 rounded-lg cursor-pointer bg-slate-900 transition"
              >
                Sync MetaMask
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
