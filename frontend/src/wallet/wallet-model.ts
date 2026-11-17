export type WalletSkinId = 'munk-default' | 'editorial' | 'cinema' | 'discovery';

export interface WalletSkinOption {
    id: WalletSkinId;
    name: string;
    description: string;
    badge: string;
}

export const WALLET_SKINS: WalletSkinOption[] = [
    {
        id: 'munk-default',
        name: 'MUNK Default',
        description: 'Dark cyber dashboard visual presentation with layered cards and glowing accent overlays.',
        badge: 'Pre-installed Default',
    },
    {
        id: 'editorial',
        name: 'Editorial',
        description: 'Clean typographic magazine composition with structured data tables and crisp editorial layout.',
        badge: 'Typography Lead',
    },
    {
        id: 'cinema',
        name: 'Cinema',
        description: 'Widescreen cinematic panel layout with immersive media backdrops and filmstrip activity cards.',
        badge: 'Immersive Dark',
    },
    {
        id: 'discovery',
        name: 'Discovery',
        description: 'High-density modular grid layout focused on multi-metric chips and quick action toggles.',
        badge: 'Data Dense',
    },
];

export interface WalletActivityItem {
    id: string;
    type: 'YIELD_CLAIM' | 'TOKEN_STAKE' | 'CONTENT_PASS' | 'CREATOR_TIP' | 'CONTENT_ROYALTY' | 'TOKEN_MINT' | 'TREASURY_DEPOSIT';
    title: string;
    amount: string;
    symbol: string;
    timestamp: string;
    status: 'Confirmed' | 'Pending';
    txHash: string;
    badgeColor?: string;
}

export interface ViewerHoldingItem {
    id: string;
    title: string;
    houseName: string;
    houseId: string;
    tokenSymbol: string;
    balance: string;
    valueMunk: string;
    image: string;
    kind: 'PASS' | 'TOKEN' | 'COLLECTIBLE';
    unlockedAccess: string;
    change24h: string;
}

export interface ViewerWalletData {
    address: string;
    handle: string;
    networkRole: string;
    networkTier: string;
    munkBalance: number;
    contentTokensBalance: number;
    stakedMunk: number;
    claimableRewards: number;
    holdings: ViewerHoldingItem[];
    activityHistory: WalletActivityItem[];
    eligiblePasses: {
        id: string;
        name: string;
        houseName: string;
        image: string;
        accessTier: string;
        perk: string;
    }[];
}

export interface HouseHolderItem {
    address: string;
    handle: string;
    amountHeld: string;
    sharePercentage: string;
    joinedDate: string;
}

export interface HouseWalletData {
    houseId: string;
    houseName: string;
    houseAddress: string;
    creatorRole: string;
    permissions: string[];
    treasuryMunk: number;
    tokenSymbol: string;
    tokenSupply: number;
    tokenCirculating: number;
    tokenHoldersCount: number;
    tokenPriceMunk: number;
    estimatedValuationMunk: number;
    royaltySplit: string;
    storageUsedGb: number;
    storageLimitGb: number;
    publishedWorksCount: number;
    draftWorksCount: number;
    subscribersCount: number;
    recentTransactions: WalletActivityItem[];
    topHolders: HouseHolderItem[];
    contentTokens: {
        id: string;
        name: string;
        workTitle: string;
        mintedCount: number;
        revenueGenerated: number;
        status: string;
        image: string;
    }[];
}

export const mockViewerWallet: ViewerWalletData = {
    address: '0x8A92-F4B1-39C8-01E4',
    handle: '@munk_viewer_main',
    networkRole: 'Network Participant',
    networkTier: 'Genesis Supporter Tier II',
    munkBalance: 1450.50,
    contentTokensBalance: 320.00,
    stakedMunk: 500.00,
    claimableRewards: 42.80,
    holdings: [
        {
            id: 'holding-1',
            title: 'Off-Grid Pass #042',
            houseName: 'Off Grid',
            houseId: 'off-grid',
            tokenSymbol: '$OFFGRID',
            balance: '120.00',
            valueMunk: '294.00 MUNK',
            image: 'mountains',
            kind: 'PASS',
            unlockedAccess: 'Early Access & 4K Master Downloads',
            change24h: '+8.4%',
        },
        {
            id: 'holding-2',
            title: 'The Margin Supporter Token',
            houseName: 'The Margin',
            houseId: 'the-margin',
            tokenSymbol: '$MARGIN',
            balance: '75.00',
            valueMunk: '165.00 MUNK',
            image: 'coast',
            kind: 'TOKEN',
            unlockedAccess: 'Private Essay Drafts & Director Audio',
            change24h: '+3.2%',
        },
        {
            id: 'holding-3',
            title: 'Field Notes Journal Badge',
            houseName: 'Field Notes',
            houseId: 'field-notes',
            tokenSymbol: '$FIELD',
            balance: '50.00',
            valueMunk: '95.00 MUNK',
            image: 'notebook',
            kind: 'COLLECTIBLE',
            unlockedAccess: 'Weekly Notebook Excerpts',
            change24h: '0.0%',
        },
        {
            id: 'holding-4',
            title: 'Signal Hill Access Pass',
            houseName: 'Signal Hill',
            houseId: 'signal-hill',
            tokenSymbol: '$SIGNAL',
            balance: '75.00',
            valueMunk: '142.50 MUNK',
            image: 'forest',
            kind: 'PASS',
            unlockedAccess: 'Behind The Scenes Film Stills',
            change24h: '+12.1%',
        },
    ],
    eligiblePasses: [
        {
            id: 'pass-a',
            name: 'MUNK Network Staking Pass',
            houseName: 'MUNK Protocol',
            image: 'forestCamp',
            accessTier: 'Tier 1 Staker',
            perk: 'Daily MUNK Rewards & Governance Weight',
        },
        {
            id: 'pass-b',
            name: 'Coastal Film Syndicate',
            houseName: 'The Margin',
            image: 'coast',
            accessTier: 'Supporter',
            perk: 'Ad-Free High Bitrate Streaming',
        },
        {
            id: 'pass-c',
            name: 'Highland Field Journal',
            houseName: 'Off Grid',
            image: 'mountains',
            accessTier: 'Pioneer',
            perk: 'Raw Stills & Uncut Audio Access',
        },
    ],
    activityHistory: [
        {
            id: 'act-1',
            type: 'YIELD_CLAIM',
            title: 'Staking Reward Claim',
            amount: '+14.20',
            symbol: 'MUNK',
            timestamp: '2 hours ago',
            status: 'Confirmed',
            txHash: '0x3d9...a1b2',
        },
        {
            id: 'act-2',
            type: 'CONTENT_PASS',
            title: 'Acquired Off-Grid Pass #042',
            amount: '-120.00',
            symbol: 'MUNK',
            timestamp: '1 day ago',
            status: 'Confirmed',
            txHash: '0x8f2...c4e9',
        },
        {
            id: 'act-3',
            type: 'CREATOR_TIP',
            title: 'Supported Elias Reed (The Margin)',
            amount: '-25.00',
            symbol: 'MUNK',
            timestamp: '3 days ago',
            status: 'Confirmed',
            txHash: '0x1c4...e7f0',
        },
        {
            id: 'act-4',
            type: 'TOKEN_STAKE',
            title: 'Staked to Network Pool',
            amount: '+500.00',
            symbol: 'MUNK',
            timestamp: '5 days ago',
            status: 'Confirmed',
            txHash: '0x6e2...9a0b',
        },
    ],
};

export const mockHouseWallets: Record<string, HouseWalletData> = {
    'off-grid': {
        houseId: 'off-grid',
        houseName: 'Off Grid',
        houseAddress: '0x3F12-9D8E-4A01-C772',
        creatorRole: 'House Owner & Primary Operator',
        permissions: [
            'Mint Content Tokens',
            'Manage House Treasury',
            'Publish Works & Video Streams',
            'Set Royalty & Revenue Split',
            'Customize House Wallet Skin',
        ],
        treasuryMunk: 18420.00,
        tokenSymbol: '$OFFGRID',
        tokenSupply: 1000000,
        tokenCirculating: 345000,
        tokenHoldersCount: 284,
        tokenPriceMunk: 2.45,
        estimatedValuationMunk: 845250,
        royaltySplit: '85% Creator House / 15% Protocol Vault',
        storageUsedGb: 4.2,
        storageLimitGb: 50.0,
        publishedWorksCount: 12,
        draftWorksCount: 3,
        subscribersCount: 1420,
        topHolders: [
            { address: '0x9b1...8c2d', handle: '@mountain_scout', amountHeld: '45,000 $OFFGRID', sharePercentage: '13.0%', joinedDate: 'Nov 2024' },
            { address: '0x4e2...1a5f', handle: '@cinema_collector', amountHeld: '32,500 $OFFGRID', sharePercentage: '9.4%', joinedDate: 'Dec 2024' },
            { address: '0x8a9...4b1c', handle: '@munk_viewer_main', amountHeld: '12,000 $OFFGRID', sharePercentage: '3.4%', joinedDate: 'Jan 2025' },
        ],
        contentTokens: [
            { id: 'ct-1', name: 'The Long Way Home NFT-Pass', workTitle: 'The long way home', mintedCount: 150, revenueGenerated: 3600.00, status: 'Active Mint', image: 'mountains' },
            { id: 'ct-2', name: 'Simpler Life Founder Pass', workTitle: 'Building a simpler life', mintedCount: 80, revenueGenerated: 2400.00, status: 'Sold Out', image: 'forestCamp' },
            { id: 'ct-3', name: 'Slower Morning Essay Access', workTitle: 'A slower kind of morning', mintedCount: 220, revenueGenerated: 1100.00, status: 'Active Mint', image: 'van' },
        ],
        recentTransactions: [
            {
                id: 'h-tx-1',
                type: 'CONTENT_ROYALTY',
                title: 'Video Streaming Royalty Payout',
                amount: '+450.00',
                symbol: 'MUNK',
                timestamp: '1 hour ago',
                status: 'Confirmed',
                txHash: '0x7e1...9f8b',
            },
            {
                id: 'h-tx-2',
                type: 'TOKEN_MINT',
                title: 'Minted 500 $OFFGRID Content Tokens',
                amount: '+500',
                symbol: '$OFFGRID',
                timestamp: '1 day ago',
                status: 'Confirmed',
                txHash: '0x2a4...6b8c',
            },
            {
                id: 'h-tx-3',
                type: 'TREASURY_DEPOSIT',
                title: 'Viewer Direct Supporter Deposit',
                amount: '+1,200.00',
                symbol: 'MUNK',
                timestamp: '3 days ago',
                status: 'Confirmed',
                txHash: '0x5c9...1d3e',
            },
        ],
    },
    'the-margin': {
        houseId: 'the-margin',
        houseName: 'The Margin',
        houseAddress: '0x7E49-11C2-88B3-E001',
        creatorRole: 'House Owner & Essayist',
        permissions: [
            'Mint Content Tokens',
            'Manage House Treasury',
            'Publish Coastal Essays',
            'Customize House Wallet Skin',
        ],
        treasuryMunk: 9140.00,
        tokenSymbol: '$MARGIN',
        tokenSupply: 500000,
        tokenCirculating: 180000,
        tokenHoldersCount: 145,
        tokenPriceMunk: 2.20,
        estimatedValuationMunk: 396000,
        royaltySplit: '85% Creator House / 15% Protocol Vault',
        storageUsedGb: 1.8,
        storageLimitGb: 50.0,
        publishedWorksCount: 6,
        draftWorksCount: 1,
        subscribersCount: 890,
        topHolders: [
            { address: '0x1c4...e7f0', handle: '@coastal_reader', amountHeld: '24,000 $MARGIN', sharePercentage: '13.3%', joinedDate: 'Dec 2024' },
            { address: '0x8a9...4b1c', handle: '@munk_viewer_main', amountHeld: '7,500 $MARGIN', sharePercentage: '4.1%', joinedDate: 'Jan 2025' },
        ],
        contentTokens: [
            { id: 'ct-m1', name: 'Tides & Timing Supporter Token', workTitle: 'Tides and timing', mintedCount: 100, revenueGenerated: 2200.00, status: 'Active Mint', image: 'coast' },
        ],
        recentTransactions: [
            {
                id: 'h-tx-m1',
                type: 'CONTENT_ROYALTY',
                title: 'Essay Reader Royalties',
                amount: '+180.00',
                symbol: 'MUNK',
                timestamp: '4 hours ago',
                status: 'Confirmed',
                txHash: '0x9a3...4e1f',
            },
        ],
    },
};

export function getHouseWallet(houseId: string): HouseWalletData {
    if (mockHouseWallets[houseId]) {
        return mockHouseWallets[houseId];
    }
    // Generic fallback for any other House ID
    return {
        houseId,
        houseName: houseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        houseAddress: `0x${houseId.slice(0, 4).toUpperCase()}-4021-88E2-A901`,
        creatorRole: 'House Owner & Primary Operator',
        permissions: [
            'Mint Content Tokens',
            'Manage House Treasury',
            'Publish Content',
            'Customize House Wallet Skin',
        ],
        treasuryMunk: 5200.00,
        tokenSymbol: `$${houseId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`,
        tokenSupply: 500000,
        tokenCirculating: 120000,
        tokenHoldersCount: 92,
        tokenPriceMunk: 1.85,
        estimatedValuationMunk: 222000,
        royaltySplit: '85% Creator House / 15% Protocol Vault',
        storageUsedGb: 1.2,
        storageLimitGb: 50.0,
        publishedWorksCount: 4,
        draftWorksCount: 1,
        subscribersCount: 450,
        topHolders: [
            { address: '0x8a9...4b1c', handle: '@munk_viewer_main', amountHeld: '5,000 Tokens', sharePercentage: '4.1%', joinedDate: 'Jan 2025' },
        ],
        contentTokens: [
            { id: `ct-${houseId}-1`, name: `${houseId} Pioneer Token`, workTitle: 'House Master Work', mintedCount: 50, revenueGenerated: 925.00, status: 'Active Mint', image: 'forest' },
        ],
        recentTransactions: [
            {
                id: `tx-${houseId}-1`,
                type: 'CONTENT_ROYALTY',
                title: 'Content Access Payout',
                amount: '+120.00',
                symbol: 'MUNK',
                timestamp: '5 hours ago',
                status: 'Confirmed',
                txHash: '0x4e2...8a9c',
            },
        ],
    };
}
