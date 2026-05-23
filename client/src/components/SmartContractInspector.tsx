/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check, FileCode, Shield, Users, Coins, HelpCircle } from "lucide-react";

export function SmartContractInspector() {
  const [copied, setCopied] = useState(false);

  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DecentralizedURLSafetyRegistry
 * @dev Governs community-reported malicious links, staking, and reputation mechanics.
 */
contract DecentralizedURLSafetyRegistry is Ownable {
    
    struct DomainThreat {
        string url;
        address reporter;
        uint256 timestamp;
        string reason;
        uint32 votesUp;
        uint32 votesDown;
        uint16 riskScore; // 0 to 100
        bool isActive;
        bool isAppealed;
    }

    // Reputation Token (for staking and rewards validation)
    IERC20 public repToken;
    uint256 public constant REPORT_STAKE = 50 * 10**18; // Stake required to flag url
    uint256 public constant RESOLUTION_REWARD = 25 * 10**18; // Reward for valid reports

    // Blacklist directory mapping URL hash -> Threat info
    mapping(bytes32 => DomainThreat) private _threatRegistry;
    bytes32[] private _blacklistHashes;

    // Reporter reputation tracker mapping address -> score
    mapping(address => uint256) public reputationScore;
    mapping(address => uint256) public stakeBalance;

    // Events emitted for browser extensions indexing nodes
    event URLFlagged(bytes32 indexed urlHash, string url, address indexed reporter, uint256 timestamp, uint16 riskScore);
    event VoteCast(bytes32 indexed urlHash, address indexed voter, bool support, uint32 newVotesCount);
    event ThreatCleared(bytes32 indexed urlHash, uint256 timestamp);

    constructor(address tokenAddress) Ownable(msg.sender) {
        repToken = IERC20(tokenAddress);
    }

    /**
     * @notice Registers a new malicious URL to the shared blockchain ledger
     */
    function flagURL(
        string calldata url, 
        string calldata reason, 
        uint16 predictedRisk
    ) external returns (bytes32) {
        bytes32 urlHash = keccak256(abi.encodePacked(url));
        require(!_threatRegistry[urlHash].isActive, "URL remains flagged active in blacklist registry.");
        
        // Stake tokens to secure report accountability
        require(repToken.transferFrom(msg.sender, address(this), REPORT_STAKE), "Stake token transfer failed.");
        stakeBalance[msg.sender] += REPORT_STAKE;

        _threatRegistry[urlHash] = DomainThreat({
            url: url,
            reporter: msg.sender,
            timestamp: block.timestamp,
            reason: reason,
            votesUp: 1,
            votesDown: 0,
            riskScore: predictedRisk,
            isActive: true,
            isAppealed: false
        });

        _blacklistHashes.push(urlHash);
        reputationScore[msg.sender] += 10;

        emit URLFlagged(urlHash, url, msg.sender, block.timestamp, predictedRisk);
        return urlHash;
    }

    /**
     * @notice Vote to affirm or contest reported threats. Drives reputation consensus.
     */
    function voteOnThreat(string calldata url, bool support) external {
        bytes32 urlHash = keccak256(abi.encodePacked(url));
        DomainThreat storage threat = _threatRegistry[urlHash];
        require(threat.isActive, "Threat must be actively indexable.");

        if (support) {
            threat.votesUp += 1;
            reputationScore[threat.reporter] += 2;
            emit VoteCast(urlHash, msg.sender, true, threat.votesUp);
        } else {
            threat.votesDown += 1;
            reputationScore[threat.reporter] = reputationScore[threat.reporter] > 5 ? reputationScore[threat.reporter] - 5 : 0;
            emit VoteCast(urlHash, msg.sender, false, threat.votesDown);
            
            // If malicious claim is highly disputed, disable blacklisting and slash stake
            if (threat.votesDown > threat.votesUp + 10) {
                threat.isActive = false;
                threat.isAppealed = true;
                stakeBalance[threat.reporter] -= REPORT_STAKE;
                // Distribute half back to owner; half burned or rewarded to dispute voters
                emit ThreatCleared(urlHash, block.timestamp);
            }
        }
    }

    function checkURL(string calldata url) external view returns (bool isBlacklisted, uint16 riskScore, string memory reason) {
        bytes32 urlHash = keccak256(abi.encodePacked(url));
        DomainThreat memory threat = _threatRegistry[urlHash];
        return (threat.isActive, threat.riskScore, threat.reason);
    }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(contractCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="smart-contract-inspector" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 text-slate-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <FileCode className="w-6 h-6 text-cyan-400" />
            Solidity Decentralized Threat Registry
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Standard Ledger Smart Contract managing staking incentives, reputation, and consensus events.
          </p>
        </div>
        <button
          onClick={copyCode}
          id="btn-copy-solidity"
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-slate-700 hover:border-cyan-400 hover:text-cyan-400 text-slate-300 rounded-lg cursor-pointer bg-slate-800 transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 animate-pulse" /> Spanned Contract!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy Smart Contract Code
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mt-0.5">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Collateral Staking Mechanism</h4>
            <p className="text-xs text-slate-400 mt-1">
              Reporters deposit 50 <span className="text-cyan-400 font-mono">UTX</span> tokens to report suspicious links. Validations secure the stake; malicious alerts lead to slashing to deter false flags.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 mt-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Decentralized Voting & Consensus</h4>
            <p className="text-xs text-slate-400 mt-1">
              Community delegates can upvote reports to confirm threats or downvote/appeal to correct false flags. A network dispute ratio controls domain release states.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 p-4 border border-slate-800/60 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Smart Extension Client Listeners</h4>
            <p className="text-xs text-slate-400 mt-1">
              Clients listen to decentralized <span className="text-mono text-amber-400">URLFlagged</span> events emit logs. Browser proxies instantly look up local hash logs to block connection ports.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-2 right-4 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Solidity v0.8.20
        </div>
        <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto max-h-96 text-xs text-slate-300 font-mono leading-relaxed border border-slate-800/80 custom-scroll">
          {contractCode}
        </pre>
      </div>

      <div className="flex items-center gap-2 mt-6 text-slate-400 text-xs italic bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>This solidity contract can be compiled directly on <strong>Remix IDE</strong> or deployed to any EVM (Ethereum Virtual Machine) networks like Sepolia Testnet or Arbitrum L2.</span>
      </div>
    </div>
  );
}
