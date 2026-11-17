import { useState } from 'react';
import {
    Grid, LayoutGrid, Coins, ShieldCheck, Sparkles, Plus,
    ArrowUpRight, RefreshCw, Zap, TrendingUp, Layers, Check
} from 'lucide-react';
import { Image } from '../components';
import type { ViewerWalletData, HouseWalletData } from './wallet-model';

interface DiscoverySkinProps {
    mode: 'viewer' | 'house';
    viewerData: ViewerWalletData;
    houseData: HouseWalletData;
    onClaimRewards: () => void;
    onDepositTreasury: (amount: number) => void;
    onOpenHouse: (houseId: string) => void;
}

export function DiscoverySkin({
    mode,
    viewerData,
    houseData,
    onClaimRewards,
    onDepositTreasury,
    onOpenHouse,
}: DiscoverySkinProps) {
    const isViewer = mode === 'viewer';
    const [filterCategory, setFilterCategory] = useState<'all' | 'tokens' | 'passes'>('all');

    return (
        <div className="discovery-wallet-container">
            {/* Header Toolbar */}
            <div className="discovery-toolbar">
                <div className="toolbar-left">
                    <span className="discovery-chip active">
                        <Grid size={14} />
                        <span>DISCOVERY DENSE GRID</span>
                    </span>
                    <span className="discovery-chip">
                        {isViewer ? viewerData.address : houseData.houseAddress}
                    </span>
                </div>

                <div className="toolbar-right">
                    {isViewer ? (
                        <button className="discovery-btn-action" onClick={onClaimRewards}>
                            <Sparkles size={14} />
                            <span>Claim Rewards ({viewerData.claimableRewards.toFixed(1)} MUNK)</span>
                        </button>
                    ) : (
                        <button className="discovery-btn-action" onClick={() => onDepositTreasury(200)}>
                            <Plus size={14} />
                            <span>Deposit Treasury (+200 MUNK)</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Chips Row */}
            <div className="discovery-chips-row">
                {isViewer ? (
                    <>
                        <div className="metric-chip-card">
                            <small>MUNK BALANCE</small>
                            <strong>{viewerData.munkBalance.toFixed(2)} MUNK</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>STAKED</small>
                            <strong>{viewerData.stakedMunk.toFixed(2)} MUNK</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>PASSES HELD</small>
                            <strong>{viewerData.holdings.length} Active Passes</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>NETWORK TIER</small>
                            <strong>{viewerData.networkTier}</strong>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="metric-chip-card">
                            <small>TREASURY</small>
                            <strong>{houseData.treasuryMunk.toFixed(2)} MUNK</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>TOKEN PRICE</small>
                            <strong>{houseData.tokenPriceMunk.toFixed(2)} MUNK / {houseData.tokenSymbol}</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>HOLDERS</small>
                            <strong>{houseData.tokenHoldersCount} Members</strong>
                        </div>
                        <div className="metric-chip-card">
                            <small>STORAGE</small>
                            <strong>{houseData.storageUsedGb} GB / {houseData.storageLimitGb} GB</strong>
                        </div>
                    </>
                )}
            </div>

            {/* High-Density Card Grid */}
            <div className="discovery-section-header">
                <h3>{isViewer ? 'HOLDINGS & ACCESS PASSES' : 'CONTENT TOKENS & ASSETS'}</h3>
                <div className="filter-pills">
                    <button className={filterCategory === 'all' ? 'active' : ''} onClick={() => setFilterCategory('all')}>All</button>
                    <button className={filterCategory === 'tokens' ? 'active' : ''} onClick={() => setFilterCategory('tokens')}>Tokens</button>
                    <button className={filterCategory === 'passes' ? 'active' : ''} onClick={() => setFilterCategory('passes')}>Passes</button>
                </div>
            </div>

            <div className="discovery-dense-grid">
                {isViewer ? (
                    viewerData.holdings.map((item) => (
                        <div key={item.id} className="dense-grid-card" onClick={() => onOpenHouse(item.houseId)}>
                            <div className="dense-card-media">
                                <Image name={item.image} alt={item.title} />
                                <span className="dense-tag">{item.kind}</span>
                            </div>
                            <div className="dense-card-body">
                                <h4>{item.title}</h4>
                                <small>{item.houseName}</small>
                                <div className="dense-card-footer">
                                    <strong>{item.valueMunk}</strong>
                                    <span className="change-badge">{item.change24h}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    houseData.contentTokens.map((ct) => (
                        <div key={ct.id} className="dense-grid-card">
                            <div className="dense-card-media">
                                <Image name={ct.image} alt={ct.name} />
                                <span className="dense-tag green">{ct.status}</span>
                            </div>
                            <div className="dense-card-body">
                                <h4>{ct.name}</h4>
                                <small>{ct.workTitle}</small>
                                <div className="dense-card-footer">
                                    <strong>{ct.revenueGenerated.toFixed(2)} MUNK</strong>
                                    <span className="mint-count">{ct.mintedCount} Minted</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Two-Column Data Feed */}
            <div className="discovery-bottom-split">
                <div className="discovery-panel">
                    <h4>{isViewer ? 'ELIGIBLE PASSES' : 'HOUSE PERMISSIONS'}</h4>
                    <div className="discovery-mini-list">
                        {isViewer ? (
                            viewerData.eligiblePasses.map((pass) => (
                                <div key={pass.id} className="mini-item">
                                    <strong>{pass.name}</strong>
                                    <span>{pass.houseName} · {pass.perk}</span>
                                </div>
                            ))
                        ) : (
                            houseData.permissions.map((perm, idx) => (
                                <div key={idx} className="mini-item Simple">
                                    <Check size={14} />
                                    <span>{perm}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="discovery-panel">
                    <h4>RECENT WALLET TRANSACTIONS</h4>
                    <div className="discovery-mini-list">
                        {(isViewer ? viewerData.activityHistory : houseData.recentTransactions).map((tx) => (
                            <div key={tx.id} className="mini-item">
                                <div className="tx-left">
                                    <strong>{tx.title}</strong>
                                    <small>{tx.timestamp} · {tx.txHash}</small>
                                </div>
                                <span className="tx-val">{tx.amount} {tx.symbol}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
