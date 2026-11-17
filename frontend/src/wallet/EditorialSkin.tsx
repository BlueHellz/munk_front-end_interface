import { useState } from 'react';
import {
    Wallet, ShieldCheck, Coins, Sparkles, Plus, ArrowUpRight,
    BookOpen, Layers, CheckCircle2, Award, ArrowRight, UserCheck
} from 'lucide-react';
import { Image } from '../components';
import type { ViewerWalletData, HouseWalletData } from './wallet-model';

interface EditorialSkinProps {
    mode: 'viewer' | 'house';
    viewerData: ViewerWalletData;
    houseData: HouseWalletData;
    onClaimRewards: () => void;
    onDepositTreasury: (amount: number) => void;
    onOpenHouse: (houseId: string) => void;
}

export function EditorialSkin({
    mode,
    viewerData,
    houseData,
    onClaimRewards,
    onDepositTreasury,
    onOpenHouse,
}: EditorialSkinProps) {
    const isViewer = mode === 'viewer';
    const [selectedTab, setSelectedTab] = useState<'overview' | 'holdings' | 'activity'>('overview');

    return (
        <div className="editorial-wallet-container">
            {/* Editorial Masthead */}
            <header className="editorial-masthead">
                <div className="masthead-top">
                    <span className="masthead-issue">VOL. IV · MUNK WALLET BACK-OFFICE</span>
                    <span className="masthead-date">AUTHENTICATED USER ENVIRONMENT</span>
                </div>
                <h1 className="masthead-title">
                    {isViewer ? 'Viewer Wallet & Portfolio' : `${houseData.houseName} Operational Ledger`}
                </h1>
                <p className="masthead-subtitle">
                    {isViewer
                        ? `Identity: ${viewerData.address} · ${viewerData.networkTier}`
                        : `House Wallet: ${houseData.houseAddress} · ${houseData.creatorRole}`}
                </p>
            </header>

            {/* Editorial Key Metrics Band */}
            <div className="editorial-metrics-grid">
                {isViewer ? (
                    <>
                        <div className="metric-box">
                            <small>TOTAL MUNK BALANCE</small>
                            <span className="metric-value">{viewerData.munkBalance.toFixed(2)} MUNK</span>
                            <span className="metric-sub">Liquid network currency</span>
                        </div>
                        <div className="metric-box">
                            <small>CONTENT TOKENS</small>
                            <span className="metric-value">{viewerData.contentTokensBalance.toFixed(2)} ECT</span>
                            <span className="metric-sub">{viewerData.holdings.length} House Passes held</span>
                        </div>
                        <div className="metric-box">
                            <small>STAKED BALANCE</small>
                            <span className="metric-value">{viewerData.stakedMunk.toFixed(2)} MUNK</span>
                            <span className="metric-sub">Generating daily yield</span>
                        </div>
                        <div className="metric-box Highlight">
                            <small>CLAIMABLE REWARDS</small>
                            <span className="metric-value">{viewerData.claimableRewards.toFixed(2)} MUNK</span>
                            <button className="editorial-btn" onClick={onClaimRewards}>Claim Now</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="metric-box">
                            <small>TREASURY BALANCE</small>
                            <span className="metric-value">{houseData.treasuryMunk.toFixed(2)} MUNK</span>
                            <span className="metric-sub">House Reserve Funds</span>
                        </div>
                        <div className="metric-box">
                            <small>TOKEN SUPPLY</small>
                            <span className="metric-value">{houseData.tokenSupply.toLocaleString()} {houseData.tokenSymbol}</span>
                            <span className="metric-sub">{houseData.tokenCirculating.toLocaleString()} Circulating</span>
                        </div>
                        <div className="metric-box">
                            <small>ACTIVE HOLDERS</small>
                            <span className="metric-value">{houseData.tokenHoldersCount} Supporters</span>
                            <span className="metric-sub">Across MUNK Network</span>
                        </div>
                        <div className="metric-box Highlight">
                            <small>ESTIMATED VALUATION</small>
                            <span className="metric-value">{houseData.estimatedValuationMunk.toLocaleString()} MUNK</span>
                            <button className="editorial-btn" onClick={() => onDepositTreasury(250)}>Deposit Funds</button>
                        </div>
                    </>
                )}
            </div>

            {/* Main Editorial Content Columns */}
            <div className="editorial-columns-layout">
                <main className="editorial-primary-col">
                    <div className="editorial-section-title">
                        <h2>{isViewer ? 'Personal Content Holdings' : 'Content-Token Catalog & Revenue'}</h2>
                    </div>

                    <div className="editorial-table-container">
                        <table className="editorial-data-table">
                            <thead>
                                <tr>
                                    <th>{isViewer ? 'House / Asset' : 'Content Asset'}</th>
                                    <th>{isViewer ? 'Pass Type' : 'Minted Count'}</th>
                                    <th>{isViewer ? 'Balance' : 'Revenue Generated'}</th>
                                    <th>{isViewer ? 'Unlocked Access' : 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isViewer ? (
                                    viewerData.holdings.map((h) => (
                                        <tr key={h.id} onClick={() => onOpenHouse(h.houseId)} className="clickable-row">
                                            <td className="cell-asset">
                                                <div className="table-asset-info">
                                                    <strong>{h.title}</strong>
                                                    <small>{h.houseName}</small>
                                                </div>
                                            </td>
                                            <td><span className="tag-pill">{h.kind}</span></td>
                                            <td><strong>{h.valueMunk}</strong></td>
                                            <td><small>{h.unlockedAccess}</small></td>
                                        </tr>
                                    ))
                                ) : (
                                    houseData.contentTokens.map((ct) => (
                                        <tr key={ct.id}>
                                            <td className="cell-asset">
                                                <div className="table-asset-info">
                                                    <strong>{ct.name}</strong>
                                                    <small>{ct.workTitle}</small>
                                                </div>
                                            </td>
                                            <td>{ct.mintedCount} Minted</td>
                                            <td><strong>{ct.revenueGenerated.toFixed(2)} MUNK</strong></td>
                                            <td><span className="tag-pill green">{ct.status}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="editorial-article-box">
                        <h3>{isViewer ? 'About Viewer Wallet Identity' : 'House Ownership & Permissions'}</h3>
                        <p>
                            {isViewer
                                ? 'The Viewer Wallet is your personal identity inside the MUNK network. It tracks your eligible token activity, access passes, and creator contributions while keeping your reading & watching preferences completely private.'
                                : `The House Wallet is the operating environment for ${houseData.houseName}. Content publishing, token issuance, and treasury management are bound directly to this House identity.`}
                        </p>
                    </div>
                </main>

                <aside className="editorial-secondary-col">
                    <div className="editorial-sidebar-card">
                        <h3>{isViewer ? 'Eligible Passes & Perks' : 'Creator Permissions'}</h3>
                        <ul className="editorial-list">
                            {isViewer ? (
                                viewerData.eligiblePasses.map((pass) => (
                                    <li key={pass.id}>
                                        <strong>{pass.name}</strong>
                                        <small>{pass.houseName} · {pass.perk}</small>
                                    </li>
                                ))
                            ) : (
                                houseData.permissions.map((perm, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={15} className="check-icon" />
                                        <span>{perm}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="editorial-sidebar-card">
                        <h3>Recent Ledger Activity</h3>
                        <div className="editorial-activity-feed">
                            {(isViewer ? viewerData.activityHistory : houseData.recentTransactions).map((act) => (
                                <div key={act.id} className="editorial-act-item">
                                    <div className="act-details">
                                        <strong>{act.title}</strong>
                                        <small>{act.timestamp} · {act.txHash}</small>
                                    </div>
                                    <span className="act-amount">{act.amount} {act.symbol}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
