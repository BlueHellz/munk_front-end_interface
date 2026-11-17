import { useState } from 'react';
import {
    Wallet, Building2, Paintbrush, ShieldCheck, Lock,
    ArrowRight, Check, ChevronDown, Sparkles
} from 'lucide-react';
import { houses } from '../fixtures';
import { useWalletState } from './wallet-service';
import { WALLET_SKINS, type WalletSkinId } from './wallet-model';
import { MunkDefaultSkin } from './MunkDefaultSkin';
import { EditorialSkin } from './EditorialSkin';
import { CinemaSkin } from './CinemaSkin';
import { DiscoverySkin } from './DiscoverySkin';
import './wallet.css';

interface WalletViewProps {
    mode?: 'viewer' | 'house';
    houseId?: string;
}

export function WalletView({ mode = 'viewer', houseId = 'off-grid' }: WalletViewProps) {
    const activeHouseId = houseId || 'off-grid';
    const wallet = useWalletState(mode, activeHouseId);
    const [skinPickerOpen, setSkinPickerOpen] = useState(false);
    const [houseSelectorOpen, setHouseSelectorOpen] = useState(false);

    const isViewer = mode === 'viewer';
    const currentHouse = houses.find(h => h.id === activeHouseId) || houses[0];

    const handleOpenHouse = (id: string) => {
        location.hash = `#/houses/${id}`;
    };

    return (
        <main className="munk-wallet-page" data-wallet-mode={mode} data-wallet-skin={wallet.currentSkin}>
            {/* Wallet System Bar & Skin Switcher Header */}
            <div className="wallet-system-bar">
                <div className="bar-left-roles">
                    <div className="role-switcher-group">
                        <a
                            href="#/wallet/viewer"
                            className={`role-tab ${isViewer ? 'active' : ''}`}
                            aria-current={isViewer ? 'page' : undefined}
                        >
                            <Wallet size={16} />
                            <span>Viewer Wallet</span>
                        </a>
                        <a
                            href={`#/wallet/house/${activeHouseId}`}
                            className={`role-tab ${!isViewer ? 'active' : ''}`}
                            aria-current={!isViewer ? 'page' : undefined}
                        >
                            <Building2 size={16} />
                            <span>House Wallet ({currentHouse.name})</span>
                        </a>
                    </div>

                    {!isViewer && (
                        <div className="house-picker-dropdown">
                            <button
                                className="picker-trigger-btn"
                                onClick={() => setHouseSelectorOpen(!houseSelectorOpen)}
                                aria-expanded={houseSelectorOpen}
                            >
                                <span>Switch House: <strong>{currentHouse.name}</strong></span>
                                <ChevronDown size={14} />
                            </button>
                            {houseSelectorOpen && (
                                <div className="picker-menu">
                                    {houses.slice(0, 4).map(h => (
                                        <a
                                            key={h.id}
                                            href={`#/wallet/house/${h.id}`}
                                            className={h.id === activeHouseId ? 'selected' : ''}
                                            onClick={() => setHouseSelectorOpen(false)}
                                        >
                                            <strong>{h.name}</strong>
                                            <small>@creator_{h.id}</small>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bar-right-skins">
                    <div className="skin-selector-container">
                        <button
                            className="skin-picker-button"
                            onClick={() => setSkinPickerOpen(!skinPickerOpen)}
                            aria-expanded={skinPickerOpen}
                        >
                            <Paintbrush size={15} />
                            <span>Skin: <strong>{WALLET_SKINS.find(s => s.id === wallet.currentSkin)?.name}</strong></span>
                            <ChevronDown size={14} />
                        </button>

                        {skinPickerOpen && (
                            <div className="skin-picker-menu">
                                <div className="skin-menu-header">
                                    <span>SELECT WALLET PRESENTATION SKIN</span>
                                </div>
                                {WALLET_SKINS.map(skinOption => (
                                    <button
                                        key={skinOption.id}
                                        className={`skin-option-item ${wallet.currentSkin === skinOption.id ? 'active' : ''}`}
                                        onClick={() => {
                                            wallet.changeSkin(skinOption.id);
                                            setSkinPickerOpen(false);
                                        }}
                                    >
                                        <div className="skin-option-title">
                                            <strong>{skinOption.name}</strong>
                                            <span className="skin-badge">{skinOption.badge}</span>
                                        </div>
                                        <p>{skinOption.description}</p>
                                        {wallet.currentSkin === skinOption.id && <Check size={16} className="check-icon" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Privacy Access Notification Banner */}
            <div className="wallet-access-disclosure">
                <Lock size={15} className="lock-icon" />
                <span>
                    {isViewer ? (
                        <>Private Viewer Back-Office · Seen only by wallet owner. Content holdings, tokens, and rewards balance are private.</>
                    ) : (
                        <>
                            Private House Wallet Back-Office · Seen only by House Owner (<strong>{currentHouse.name}</strong>). Public view is at <a href={`#/houses/${activeHouseId}`}>#/houses/{activeHouseId}</a>.
                        </>
                    )}
                </span>
            </div>

            {/* Action Notice Toast */}
            {wallet.actionNotice && (
                <div role="status" className="wallet-toast-notice">
                    <Sparkles size={16} />
                    <span>{wallet.actionNotice}</span>
                </div>
            )}

            {/* Render the Selected Presentation Skin */}
            {wallet.currentSkin === 'munk-default' && (
                <MunkDefaultSkin
                    mode={mode}
                    viewerData={wallet.viewerData}
                    houseData={wallet.houseData}
                    onClaimRewards={wallet.claimRewards}
                    onDepositTreasury={wallet.depositTreasury}
                    onOpenHouse={handleOpenHouse}
                />
            )}

            {wallet.currentSkin === 'editorial' && (
                <EditorialSkin
                    mode={mode}
                    viewerData={wallet.viewerData}
                    houseData={wallet.houseData}
                    onClaimRewards={wallet.claimRewards}
                    onDepositTreasury={wallet.depositTreasury}
                    onOpenHouse={handleOpenHouse}
                />
            )}

            {wallet.currentSkin === 'cinema' && (
                <CinemaSkin
                    mode={mode}
                    viewerData={wallet.viewerData}
                    houseData={wallet.houseData}
                    onClaimRewards={wallet.claimRewards}
                    onDepositTreasury={wallet.depositTreasury}
                    onOpenHouse={handleOpenHouse}
                />
            )}

            {wallet.currentSkin === 'discovery' && (
                <DiscoverySkin
                    mode={mode}
                    viewerData={wallet.viewerData}
                    houseData={wallet.houseData}
                    onClaimRewards={wallet.claimRewards}
                    onDepositTreasury={wallet.depositTreasury}
                    onOpenHouse={handleOpenHouse}
                />
            )}
        </main>
    );
}

export default WalletView;
