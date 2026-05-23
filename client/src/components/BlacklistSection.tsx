/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldAlert, ShieldX, EyeOff, ThumbsUp, ThumbsDown, Search, ArrowUpRight, CheckCircle2, AlertTriangle, RefreshCw 
} from "lucide-react";
import { BlacklistEntry } from "../types";

interface BlacklistSectionProps {
  blacklist: BlacklistEntry[];
  onVote: (id: string, voteType: 'up' | 'down') => void;
  isLoading: boolean;
}

export function BlacklistSection({ blacklist, onVote, isLoading }: BlacklistSectionProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'cleared'>('all');

  const filtered = blacklist.filter((item) => {
    const matchesSearch = item.url.toLowerCase().includes(search.toLowerCase()) || 
                          item.reason.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && item.status === filter;
  });

  return (
    <div id="blacklist-viewer-component" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-lg text-slate-300 space-y-6">
      
      {/* Search Header and Controllers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldX className="w-6 h-6 text-rose-500 animate-pulse" />
            Blockchain Blacklist Directory
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Browse public threat entries mined directly from Solidity smart contracts event emissions.
          </p>
        </div>

        {/* Filter Toggle Controls */}
        <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilter('all')}
            id="filter-btn-all"
            className={`px-3 py-1 bg-transparent hover:text-white rounded-lg cursor-pointer ${filter === 'all' ? "bg-slate-850 text-white shadow" : "text-slate-400"}`}
          >
            All Ledger ({blacklist.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            id="filter-btn-active"
            className={`px-3 py-1 bg-transparent hover:text-white rounded-lg cursor-pointer ${filter === 'active' ? "bg-rose-950/40 text-rose-400 border border-rose-900/30" : "text-slate-400"}`}
          >
            Active Threats ({blacklist.filter(b => b.status === "active").length})
          </button>
          <button
            onClick={() => setFilter('cleared')}
            id="filter-btn-cleared"
            className={`px-3 py-1 bg-transparent hover:text-white rounded-lg cursor-pointer ${filter === 'cleared' ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "text-slate-400"}`}
          >
            Cleared/Appealed ({blacklist.filter(b => b.status === "cleared").length})
          </button>
        </div>
      </div>

      {/* Live Search Inputs */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter threat records by keyword, address, registrar, or domain suffix..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="blacklist-search-input"
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
        />
      </div>

      {/* Search Output List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12" id="blacklist-loading-spinner">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div id="no-blacklist-results" className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-slate-500 text-sm space-y-2">
          <EyeOff className="w-10 h-10 mx-auto text-slate-700" />
          <p className="font-semibold text-slate-400">Zero database parameters matched</p>
          <p className="text-xs max-w-sm mx-auto text-slate-500">Submit a new suspicious URL in the Analyzer dashboard to register it on-chain.</p>
        </div>
      ) : (
        <div className="space-y-4" id="blacklist-search-results-list">
          {filtered.map((item) => (
            <div 
              key={item.id} 
              id={`blacklist-item-${item.id}`}
              className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start gap-4 transition bg-slate-950/30 ${item.status === 'cleared' ? 'border-indigo-950/60' : 'border-slate-850 hover:border-slate-800'}`}
            >
              <div className="space-y-3 flex-1 min-w-0">
                {/* Badge header variables */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {item.status === 'active' ? (
                    <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wide">
                      <ShieldAlert className="w-3.5 h-3.5" /> High Risk Blacklist
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Appeal Cleared
                    </span>
                  )}
                  <span className="text-slate-500 font-mono">Timestamp: {new Date(item.timestamp).toLocaleString()}</span>
                  <span className="text-slate-500 font-mono hidden sm:inline">| ID: {item.id}</span>
                </div>

                {/* The main flagged address / URL */}
                <div className="font-mono text-sm sm:text-base font-bold text-white break-all flex items-center pr-2">
                  <span className="text-slate-500 mr-1.5 font-normal">URL:</span>
                  {item.url}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {item.reason}
                </p>

                {/* Explorer lookup link and hashes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-850">
                  <div className="truncate">
                    <span className="text-slate-500 uppercase">Reporter:</span> {item.flaggedBy}
                  </div>
                  <div className="truncate flex items-center gap-1">
                    <span className="text-slate-500 uppercase">Solidity Proof Tx:</span>
                    <a 
                      href={`https://etherscan.io/tx/${item.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      {item.txHash.substring(0, 16)}... <ArrowUpRight className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Voting utility consensus system */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-850 pt-3 md:pt-0 gap-3">
                <div className="text-right flex flex-col items-start md:items-end">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Validation Consensus</span>
                  <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                    {item.votesUp - item.votesDown >= 0 ? "+" : ""}{item.votesUp - item.votesDown} <span className="text-[10px] text-slate-400 font-normal">Votes</span>
                  </div>
                </div>

                <div className="flex gap-2 font-semibold">
                  <button
                    onClick={() => onVote(item.id, 'up')}
                    id={`btn-vote-up-${item.id}`}
                    title="Affirm threat report"
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 text-slate-300 rounded-lg text-xs cursor-pointer select-none transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span>{item.votesUp}</span>
                  </button>
                  <button
                    onClick={() => onVote(item.id, 'down')}
                    id={`btn-vote-down-${item.id}`}
                    title="Contest report / Appeal"
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 hover:text-rose-400 text-slate-300 rounded-lg text-xs cursor-pointer select-none transition"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-500/70" />
                    <span>{item.votesDown}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
