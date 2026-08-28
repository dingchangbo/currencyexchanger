/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ConvertView } from './components/ConvertView';
import { MarketRatesView } from './components/MarketRatesView';
import { FavoritePairsView } from './components/FavoritePairsView';
import { LegalDocModal } from './components/LegalDocModal';
import { ActiveTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('convert');
  const [searchQuery, setSearchQuery] = useState('');
  const [userBalance, setUserBalance] = useState(450210.00);

  // Quick conversion preset when clicked from Market Rates or Favorite Pairs
  const [convertPresets, setConvertPresets] = useState<{
    base: string;
    quote: string;
    amount?: number;
  }>({
    base: 'USD',
    quote: 'EUR',
    amount: 100000,
  });

  const [activeLegalDoc, setActiveLegalDoc] = useState<string | null>(null);

  // Quick preset from Market Rates or Favorites
  const handleSelectPairForConvert = (base: string, quote: string, amount: number = 50000) => {
    setConvertPresets({
      base,
      quote,
      amount,
    });
    setActiveTab('convert');
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectPair={(from, to) => handleSelectPairForConvert(from, to, 100000)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'convert' && (
          /* Screen 1: Convert Currency */
          <ConvertView
            key={`${convertPresets.base}-${convertPresets.quote}-${convertPresets.amount}`}
            userBalance={userBalance}
            initialFromCurrency={convertPresets.base}
            initialToCurrency={convertPresets.quote}
            initialAmount={convertPresets.amount || 100000}
          />
        )}

        {activeTab === 'market_rates' && (
          /* Screen 2: Market Rates */
          <MarketRatesView
            searchQuery={searchQuery}
            onQuickTrade={handleSelectPairForConvert}
            onAddToFavorites={(base, quote) => {
              setActiveTab('favorite_pairs');
            }}
          />
        )}

        {activeTab === 'favorite_pairs' && (
          /* Screen 4: Favorite Pairs */
          <FavoritePairsView
            searchQuery={searchQuery}
            onNavigateToConverter={handleSelectPairForConvert}
            userBalance={userBalance}
          />
        )}
      </div>

      {/* Global Footer */}
      <Footer onOpenDocModal={(doc) => setActiveLegalDoc(doc)} />

      <LegalDocModal
        title={activeLegalDoc}
        onClose={() => setActiveLegalDoc(null)}
      />
    </div>
  );
}
