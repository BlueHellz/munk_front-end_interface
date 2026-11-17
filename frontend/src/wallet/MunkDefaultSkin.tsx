import { useState } from 'react';
import {
    Search, ArrowUpRight, Heart, Sparkles, Wallet,
    Plus, ChevronRight, ChevronLeft, Globe, Newspaper,
    MessageSquare, Box, Compass
} from 'lucide-react';
import { Image } from '../components';
import type { ViewerWalletData, HouseWalletData } from './wallet-model';

interface MunkDefaultSkinProps {
    mode: 'viewer' | 'house';
    viewerData: ViewerWalletData;
    houseData: HouseWalletData;
    onClaimRewards: () => void;
    onDepositTreasury: (amount: number) => void;
    onOpenHouse: (houseId: string) => void;
}

export function MunkDefaultSkin({
    mode,
    viewerData,
    houseData,
    onClaimRewards,
    onDepositTreasury,
    onOpenHouse,
}: MunkDefaultSkinProps) {
    const [likedHero, setLikedHero] = useState(false);
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const isViewer = mode === 'viewer';

    return (
        <div className="munk-default-dashboard">
            {/* Top Navigation Bar styled strictly like the Dribbble Reference */}
            <header className="default-dashboard-header">
                <div className="header-left">
                    <div className="brand-lockup">
                        <span className="brand-logo-symbol">●</span>
                        <span className="brand-name">MUNK</span>
                        <span className="brand-mode-badge">Demo mode</span>
                    </div>

                    <div className="search-pill-box">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search MUNK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.g.target.value)}
                        />
                    </div>
                </div>

                <div className="header-center-pills">
                    <button className="nav-pill active" title="Discover">
                        <Compass size={15} />
                        <span>Discover</span>
                    </button>
                    <button className="nav-pill icon-only" title="Network World">
                        <Globe size={17} />
                    </button>
                    <button className="nav-pill icon-only" title="News & Feeds">
                        <Newspaper size={17} />
                    </button>
                    <button className="nav-pill icon-only" title="Messages">
                        <MessageSquare size={17} />
                    </button>
                    <button className="nav-pill icon-only" title="Vault & Packages">
                        <Box size={17} />
                    </button>
                </div>

                <div className="header-right-actions">
                    {isViewer ? (
                        <button className="action-pill-purple" onClick={onClaimRewards}>
                            <span>Pre-purchase Now</span>
                        </button>
                    ) : (
                        <button className="action-pill-purple" onClick={() => onDepositTreasury(250)}>
                            <Plus size={15} />
                            <span>Deposit Treasury</span>
                        </button>
                    )}

                    <button
                        className={`icon-pill-button ${likedHero ? 'active' : ''}`}
                        onClick={() => setLikedHero(!likedHero)}
                        aria-label="Bookmark wallet"
                    >
                        <Heart size={18} fill={likedHero ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </header>

            {/* Main Dashboard Body Grid */}
            <div className="dashboard-grid-layout">
                {/* Left Column: FEATURED Stack & Pop-Out Character Card */}
                <aside className="dashboard-left-col">
                    <div className="col-section-header">
                        <span className="section-label">FEATURED</span>
                        <ArrowUpRight size={16} className="section-arrow" />
                    </div>

                    <div className="featured-cards-stack">
                        <div className="featured-card-item" onClick={() => onOpenHouse('off-grid')}>
                            <div className="card-thumb">
                                <Image name="art:off-grid" alt="For The King" />
                            </div>
                            <div className="card-info">
                                <small className="card-tag">BASE GAME</small>
                                <h4 className="card-title">For The King</h4>
                            </div>
                        </div>

                        <div className="featured-card-item" onClick={() => onOpenHouse('the-margin')}>
                            <div className="card-thumb">
                                <Image name="art:the-margin" alt="Space Accident" />
                            </div>
                            <div className="card-info">
                                <small className="card-tag">BASE GAME</small>
                                <h4 className="card-title">Space Accident</h4>
                            </div>
                        </div>
                    </div>

                    {/* Sub-header with pagination arrows */}
                    <div className="sub-carousel-header">
                        <span className="sub-header-title">HORÜAI STAR RAIL</span>
                        <div className="carousel-arrows">
                            <button className="arrow-btn" aria-label="Previous"><ChevronLeft size={14} /></button>
                            <button className="arrow-btn" aria-label="Next"><ChevronRight size={14} /></button>
                        </div>
                    </div>

                    {/* Floating Pop-Out Character Card Overlay (Yellow hoodie character reference) */}
                    <div className="left-popout-character-card">
                        <div className="popout-character-art">
                            <Image name="art:campfire" alt="Featured Character" />
                        </div>
                    </div>
                </aside>

                {/* Center Column: Hero Banner & 6-Card Grid */}
                <main className="dashboard-center-col">
                    {/* Main Hero Banner with Pop-out character poster on right */}
                    <div className="hero-banner-card">
                        <div className="hero-content-left">
                            <h1 className="hero-title">
                                {isViewer ? 'Synthetic Dawn!' : `${houseData.houseName}!`}
                            </h1>
                            <div className="hero-subtitle-row">
                                <span className="hero-pill-tag">Base Game</span>
                                <span className="hero-price-badge">
                                    {isViewer ? '$12.89' : `${houseData.treasuryMunk.toFixed(0)} MUNK`}
                                </span>
                            </div>

                            <div className="hero-indicator-dots">
                                <span className={`dot ${activeHeroSlide === 0 ? 'active' : ''}`} onClick={() => setActiveHeroSlide(0)}></span>
                                <span className={`dot ${activeHeroSlide === 1 ? 'active' : ''}`} onClick={() => setActiveHeroSlide(1)}></span>
                                <span className={`dot ${activeHeroSlide === 2 ? 'active' : ''}`} onClick={() => setActiveHeroSlide(2)}></span>
                            </div>

                            <div className="hero-action-row">
                                <button className="purple-btn-hero" onClick={isViewer ? onClaimRewards : () => onDepositTreasury(500)}>
                                    <span>PURCHASE NOW</span>
                                </button>
                                <button
                                    className={`hero-heart-btn ${likedHero ? 'active' : ''}`}
                                    onClick={() => setLikedHero(!likedHero)}
                                    aria-label="Favorite Hero"
                                >
                                    <Heart size={18} fill={likedHero ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        </div>

                        {/* Pop-Out Character Poster on Right side of Hero Banner */}
                        <div className="hero-popout-poster">
                            <Image name="art:mountains" alt="Synthetic Dawn Character" />
                        </div>
                    </div>

                    {/* 6-Card Media Grid (Matching 3 cols x 2 rows with corner arrow badges) */}
                    <div className="center-cards-grid-row">
                        {[
                            { id: '1', title: 'Of BanBan 2', image: 'art:road' },
                            { id: '2', title: 'Sherlock Purr 2', image: 'art:campfire' },
                            { id: '3', title: 'Mayan Blocks Game', image: 'art:coast' },
                            { id: '4', title: 'NFT Game', image: 'art:forest' },
                            { id: '5', title: 'MUNK Story', image: 'art:notebook' },
                            { id: '6', title: 'Borderlands 4', image: 'art:mountains' },
                        ].map((card) => (
                            <div key={card.id} className="grid-media-card">
                                <div className="media-image-container">
                                    <Image name={card.image} alt={card.title} />
                                    <button className="corner-action-circle" aria-label={`Open ${card.title}`}>
                                        <ArrowUpRight size={16} />
                                    </button>
                                </div>
                                <div className="media-card-label">
                                    <h4>{card.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Right Column: "DISCOVER NEW" Stack & Bottom Floating "Free Games" Overlay */}
                <aside className="dashboard-right-col">
                    <div className="col-section-header">
                        <span className="section-label">DISCOVER NEW</span>
                        <ArrowUpRight size={16} className="section-arrow" />
                    </div>

                    <div className="right-cards-stack">
                        {/* Top Active Stack Card S.Down */}
                        <div className="right-stack-card active-card">
                            <div className="stack-card-avatar">
                                <Image name="art:mountains" alt="S.Down" />
                            </div>
                            <div className="stack-card-text">
                                <h4>S.Down</h4>
                            </div>
                            <button className="stack-arrow-btn active-arrow" aria-label="Open S.Down">
                                <ArrowUpRight size={16} />
                            </button>
                        </div>

                        {/* Stack Items */}
                        {[
                            { id: '2', name: 'Echoes Of Survival', image: 'art:forest' },
                            { id: '3', name: 'Cronos: The New Dawn', image: 'art:coast' },
                            { id: '4', name: 'Borderlands 4', image: 'art:road' },
                        ].map((item) => (
                            <div key={item.id} className="right-stack-card">
                                <div className="stack-card-avatar">
                                    <Image name={item.image} alt={item.name} />
                                </div>
                                <div className="stack-card-text">
                                    <h4>{item.name}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Floating "Free Games" Pop-out Overlay Card */}
                    <div className="bottom-floating-free-games-card">
                        <div className="floating-art-wrap">
                            <Image name="art:campfire" alt="Free Games" />
                            <button className="floating-corner-arrow" aria-label="Open Free Games">
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                        <div className="floating-card-title">
                            <h3>Free Games</h3>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
