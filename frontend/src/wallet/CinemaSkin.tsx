import { useState } from 'react';
import {
    Film, Sparkles, Plus, ArrowUpRight, Play,
    CheckCircle
} from 'lucide-react';
import { Image } from '../components';
import type { ViewerWalletData, HouseWalletData } from './wallet-model';

interface CinemaSkinProps {
    mode: 'viewer' | 'house';
    viewerData: ViewerWalletData;
    houseData: HouseWalletData;
    onClaimRewards: () => void;
    onDepositTreasury: (amount: number) => void;
    onOpenHouse: (houseId: string) => void;
}

export function CinemaSkin({
    mode,
    viewerData,
    houseData,
    onClaimRewards,
    onDepositTreasury,
    onOpenHouse,
}: CinemaSkinProps) {
    const isViewer = mode === 'viewer';
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);

    const viewerItem = viewerData.holdings[activeHeroIndex] || viewerData.holdings[0];
    const houseItem = houseData.contentTokens[activeHeroIndex] || houseData.contentTokens[0];

    const activeImage = isViewer ? viewerItem.image : houseItem.image;
    const activeTitle = isViewer ? viewerItem.title : houseItem.name;
    const activeSynopsis = isViewer
        ? `${viewerItem.houseName} · ${viewerItem.unlockedAccess}`
        : `${houseData.houseName} · ${houseItem.workTitle}`;
    const activeValue = isViewer ? viewerItem.valueMunk : `${houseItem.revenueGenerated.toFixed(2)} MUNK`;

    return (
        <div className="cinema-wallet-container">
            {/* Widescreen Hero Backdrop Stage */}
            <div className="cinema-hero-stage">
                <div className="cinema-backdrop-media">
                    <Image name={activeImage} alt={activeTitle} />
                    <div className="cinema-overlay-darkness"></div>
                </div>

                <div className="cinema-hero-content">
                    <div className="cinema-badge-row">
                        <span className="cinema-live-pill">
                            <Film size={14} />
                            <span>MUNK CINEMA {isViewer ? 'VIEWER ENVIRONMENT' : 'HOUSE STUDIO'}</span>
                        </span>
                        <span className="cinema-address-tag">
                            {isViewer ? viewerData.address : houseData.houseAddress}
                        </span>
                    </div>

                    <h1 className="cinema-hero-title">{activeTitle}</h1>

                    <p className="cinema-hero-synopsis">{activeSynopsis}</p>

                    <div className="cinema-hero-stats">
                        <div className="stat-pill">
                            <small>{isViewer ? 'MUNK BALANCE' : 'TREASURY'}</small>
                            <strong>{isViewer ? `${viewerData.munkBalance.toFixed(2)} MUNK` : `${houseData.treasuryMunk.toFixed(2)} MUNK`}</strong>
                        </div>
                        <div className="stat-pill">
                            <small>{isViewer ? 'VALUE' : 'REVENUE'}</small>
                            <strong>{activeValue}</strong>
                        </div>
                    </div>

                    <div className="cinema-hero-actions">
                        {isViewer ? (
                            <button className="cinema-btn-primary" onClick={onClaimRewards}>
                                <Sparkles size={16} />
                                <span>Claim Staking Rewards ({viewerData.claimableRewards.toFixed(1)} MUNK)</span>
                            </button>
                        ) : (
                            <button className="cinema-btn-primary" onClick={() => onDepositTreasury(300)}>
                                <Plus size={16} />
                                <span>Deposit Treasury Funds (+300 MUNK)</span>
                            </button>
                        )}
                        {isViewer && (
                            <button className="cinema-btn-secondary" onClick={() => onOpenHouse(viewerItem.houseId)}>
                                <span>Visit {viewerItem.houseName}</span>
                                <ArrowUpRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Horizontal Filmstrip Carousel */}
            <div className="cinema-filmstrip-section">
                <div className="cinema-section-header">
                    <h2>{isViewer ? 'YOUR CONTENT PASS REEL' : 'HOUSE CONTENT-TOKEN REEL'}</h2>
                    <span>Select an item to view cinema backdrop</span>
                </div>

                <div className="cinema-filmstrip-grid">
                    {isViewer ? (
                        viewerData.holdings.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`filmstrip-card ${activeHeroIndex === idx ? 'active' : ''}`}
                                onClick={() => setActiveHeroIndex(idx)}
                            >
                                <div className="filmstrip-thumb">
                                    <Image name={item.image} alt={item.title} />
                                    <div className="filmstrip-overlay">
                                        <Play size={20} className="play-icon" />
                                    </div>
                                </div>
                                <div className="filmstrip-info">
                                    <h4>{item.title}</h4>
                                    <small>{item.houseName} · {item.balance} {item.tokenSymbol}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                        houseData.contentTokens.map((ct, idx) => (
                            <div
                                key={ct.id}
                                className={`filmstrip-card ${activeHeroIndex === idx ? 'active' : ''}`}
                                onClick={() => setActiveHeroIndex(idx)}
                            >
                                <div className="filmstrip-thumb">
                                    <Image name={ct.image} alt={ct.name} />
                                    <div className="filmstrip-overlay">
                                        <Play size={20} className="play-icon" />
                                    </div>
                                </div>
                                <div className="filmstrip-info">
                                    <h4>{ct.name}</h4>
                                    <small>{ct.workTitle} · {ct.mintedCount} Minted</small>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Cinema Details Panel */}
            <div className="cinema-details-grid">
                <div className="cinema-card-panel">
                    <h3>{isViewer ? 'Eligible Pass Directory' : 'House Permissions & Roles'}</h3>
                    <div className="cinema-list">
                        {isViewer ? (
                            viewerData.eligiblePasses.map((p) => (
                                <div key={p.id} className="cinema-list-item">
                                    <Image name={p.image} className="item-art" />
                                    <div>
                                        <h4>{p.name}</h4>
                                        <small>{p.houseName} · {p.perk}</small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            houseData.permissions.map((perm, i) => (
                                <div key={i} className="cinema-list-item Simple">
                                    <CheckCircle size={16} className="cinema-check" />
                                    <span>{perm}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="cinema-card-panel">
                    <h3>Cinematic Transaction Log</h3>
                    <div className="cinema-activity-list">
                        {(isViewer ? viewerData.activityHistory : houseData.recentTransactions).map((act) => (
                            <div key={act.id} className="cinema-act-row">
                                <div>
                                    <strong>{act.title}</strong>
                                    <small>{act.timestamp} · {act.txHash}</small>
                                </div>
                                <span className="cinema-amount">{act.amount} {act.symbol}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
