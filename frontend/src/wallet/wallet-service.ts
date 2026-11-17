import { useState, useEffect } from 'react';
import { WalletSkinId, mockViewerWallet, getHouseWallet, type ViewerWalletData, type HouseWalletData } from './wallet-model';

const VIEWER_SKIN_KEY = 'munk_viewer_wallet_skin_v1';
const HOUSE_SKIN_KEY_PREFIX = 'munk_house_wallet_skin_v1:';

export function getStoredViewerSkin(): WalletSkinId {
    try {
        const saved = localStorage.getItem(VIEWER_SKIN_KEY);
        if (saved && ['munk-default', 'editorial', 'cinema', 'discovery'].includes(saved)) {
            return saved as WalletSkinId;
        }
    } catch {}
    return 'munk-default';
}

export function setStoredViewerSkin(skin: WalletSkinId): void {
    try {
        localStorage.setItem(VIEWER_SKIN_KEY, skin);
        window.dispatchEvent(new CustomEvent('munk-wallet-skin-changed', { detail: { scope: 'viewer', skin } }));
    } catch {}
}

export function getStoredHouseSkin(houseId: string): WalletSkinId {
    try {
        const saved = localStorage.getItem(HOUSE_SKIN_KEY_PREFIX + houseId);
        if (saved && ['munk-default', 'editorial', 'cinema', 'discovery'].includes(saved)) {
            return saved as WalletSkinId;
        }
    } catch {}
    return 'munk-default';
}

export function setStoredHouseSkin(houseId: string, skin: WalletSkinId): void {
    try {
        localStorage.setItem(HOUSE_SKIN_KEY_PREFIX + houseId, skin);
        window.dispatchEvent(new CustomEvent('munk-wallet-skin-changed', { detail: { scope: 'house', houseId, skin } }));
    } catch {}
}

export function useWalletState(mode: 'viewer' | 'house', houseId: string = 'off-grid') {
    const [viewerSkin, setViewerSkin] = useState<WalletSkinId>(getStoredViewerSkin);
    const [houseSkin, setHouseSkin] = useState<WalletSkinId>(() => getStoredHouseSkin(houseId));

    const [viewerData, setViewerData] = useState<ViewerWalletData>(mockViewerWallet);
    const [houseData, setHouseData] = useState<HouseWalletData>(() => getHouseWallet(houseId));

    const [actionNotice, setActionNotice] = useState<string>('');

    useEffect(() => {
        setHouseData(getHouseWallet(houseId));
        setHouseSkin(getStoredHouseSkin(houseId));
    }, [houseId]);

    useEffect(() => {
        const handleSkinChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.scope === 'viewer') {
                setViewerSkin(detail.skin);
            } else if (detail?.scope === 'house' && detail?.houseId === houseId) {
                setHouseSkin(detail.skin);
            }
        };
        window.addEventListener('munk-wallet-skin-changed', handleSkinChange);
        return () => window.removeEventListener('munk-wallet-skin-changed', handleSkinChange);
    }, [houseId]);

    const changeSkin = (newSkin: WalletSkinId) => {
        if (mode === 'viewer') {
            setViewerSkin(newSkin);
            setStoredViewerSkin(newSkin);
        } else {
            setHouseSkin(newSkin);
            setStoredHouseSkin(houseId, newSkin);
        }
        setActionNotice(`Switched presentation skin to ${newSkin.replace('-', ' ').toUpperCase()}`);
    };

    const claimRewards = () => {
        if (viewerData.claimableRewards <= 0) {
            setActionNotice('No rewards available to claim at this moment.');
            return;
        }
        const claimed = viewerData.claimableRewards;
        setViewerData(prev => ({
            ...prev,
            munkBalance: prev.munkBalance + claimed,
            claimableRewards: 0,
            activityHistory: [
                {
                    id: `act-${Date.now()}`,
                    type: 'YIELD_CLAIM',
                    title: 'Claimed Staking Rewards',
                    amount: `+${claimed.toFixed(2)}`,
                    symbol: 'MUNK',
                    timestamp: 'Just now',
                    status: 'Confirmed',
                    txHash: `0x${Math.random().toString(16).substring(2, 10)}...local`,
                },
                ...prev.activityHistory,
            ],
        }));
        setActionNotice(`Successfully claimed ${claimed.toFixed(2)} MUNK rewards!`);
    };

    const depositTreasury = (amount: number) => {
        setHouseData(prev => ({
            ...prev,
            treasuryMunk: prev.treasuryMunk + amount,
            recentTransactions: [
                {
                    id: `h-tx-${Date.now()}`,
                    type: 'TREASURY_DEPOSIT',
                    title: 'Direct Treasury Allocation',
                    amount: `+${amount.toFixed(2)}`,
                    symbol: 'MUNK',
                    timestamp: 'Just now',
                    status: 'Confirmed',
                    txHash: `0x${Math.random().toString(16).substring(2, 10)}...local`,
                },
                ...prev.recentTransactions,
            ],
        }));
        setActionNotice(`Deposited ${amount.toFixed(2)} MUNK to ${houseData.houseName} Treasury!`);
    };

    useEffect(() => {
        if (!actionNotice) return;
        const timer = setTimeout(() => setActionNotice(''), 4500);
        return () => clearTimeout(timer);
    }, [actionNotice]);

    const currentSkin = mode === 'viewer' ? viewerSkin : houseSkin;

    return {
        mode,
        houseId,
        currentSkin,
        changeSkin,
        viewerData,
        houseData,
        claimRewards,
        depositTreasury,
        actionNotice,
        setActionNotice,
    };
}
