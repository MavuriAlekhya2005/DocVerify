/**
 * Gas Estimator Component
 * Shows estimated gas costs before blockchain transactions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCurrencyDollar,
  HiLightningBolt,
  HiRefresh,
  HiExclamationCircle,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import api from '../../services/api';

const GasEstimator = ({
  operationType = 'register', // 'register', 'batch', 'revoke'
  documentCount = 1,
  showDetails = false,
  onEstimateReady,
  className = '',
}) => {
  const [estimate, setEstimate] = useState(null);
  const [gasPrices, setGasPrices] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(showDetails);

  const fetchEstimate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [estimateResult, pricesResult, walletResult] = await Promise.all([
        api.estimateGas(operationType, documentCount),
        api.getGasPrices(),
        api.getWalletBalance(),
      ]);

      if (estimateResult.success) {
        setEstimate(estimateResult.data);
        if (onEstimateReady) {
          onEstimateReady(estimateResult.data);
        }
      }
      
      if (pricesResult.success) {
        setGasPrices(pricesResult.data);
      }

      if (walletResult.success) {
        setWallet(walletResult.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to estimate gas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [operationType, documentCount]);

  const formatMatic = (value) => {
    if (!value) return '0.0000';
    const num = parseFloat(value);
    return num < 0.0001 ? '< 0.0001' : num.toFixed(4);
  };

  const formatUSD = (matic) => {
    // Approximate MATIC to USD (in production, fetch live rate)
    const rate = 0.55; // Example rate
    const usd = parseFloat(matic) * rate;
    return usd < 0.01 ? '< $0.01' : `$${usd.toFixed(2)}`;
  };

  const getSpeedLabel = (speed) => {
    switch (speed) {
      case 'fast': return { label: 'Fast', time: '~15s', color: 'text-accent-400' };
      case 'average': return { label: 'Standard', time: '~30s', color: 'text-primary-400' };
      case 'slow': return { label: 'Economy', time: '~60s', color: 'text-yellow-400' };
      default: return { label: 'Standard', time: '~30s', color: 'text-primary-400' };
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-xl p-4 border border-white/10 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Estimating gas costs...</p>
            <p className="text-gray-400 text-xs">Fetching current network prices</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 rounded-xl p-4 border border-red-500/30 ${className}`}>
        <div className="flex items-center gap-3">
          <HiExclamationCircle className="w-6 h-6 text-red-400" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button onClick={fetchEstimate} className="text-gray-400 hover:text-white">
            <HiRefresh className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const canAfford = wallet && estimate ? 
    parseFloat(wallet.balance) >= parseFloat(estimate.totalCost?.average || estimate.estimatedCost) : 
    true;

  return (
    <div className={`bg-dark-200 rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Main Display */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              canAfford ? 'bg-primary-600/20' : 'bg-red-600/20'
            }`}>
              <HiCurrencyDollar className={`w-5 h-5 ${canAfford ? 'text-primary-400' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-white font-medium">Estimated Gas Cost</p>
              <p className="text-gray-400 text-xs">
                {operationType === 'batch' 
                  ? `Batch registration (${documentCount} documents)`
                  : operationType === 'revoke'
                  ? 'Revocation transaction'
                  : 'Single registration'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xl font-bold text-white">
              {formatMatic(estimate?.estimatedCost)} MATIC
            </p>
            <p className="text-gray-400 text-sm">
              ≈ {formatUSD(estimate?.estimatedCost)}
            </p>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {!canAfford && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg text-red-400 text-sm">
            <HiExclamationCircle className="w-4 h-4" />
            Insufficient balance. You have {formatMatic(wallet?.balance)} MATIC
          </div>
        )}

        {/* Expandable Details Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          {expanded ? 'Hide details' : 'Show details'}
          {expanded ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Gas Prices */}
              {gasPrices && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">NETWORK GAS PRICES</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['slow', 'average', 'fast'].map((speed) => {
                      const info = getSpeedLabel(speed);
                      const price = gasPrices[speed];
                      return (
                        <div key={speed} className="bg-dark-300 rounded-lg p-3 text-center">
                          <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
                          <p className="text-white text-lg font-bold">{price} Gwei</p>
                          <p className="text-gray-500 text-xs">{info.time}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estimate Breakdown */}
              {estimate && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">ESTIMATE BREAKDOWN</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gas Limit</span>
                      <span className="text-white font-mono">{estimate.gasLimit?.toLocaleString()}</span>
                    </div>
                    {estimate.totalCost && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Economy Cost</span>
                          <span className="text-yellow-400">{formatMatic(estimate.totalCost.slow)} MATIC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Standard Cost</span>
                          <span className="text-primary-400">{formatMatic(estimate.totalCost.average)} MATIC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Fast Cost</span>
                          <span className="text-accent-400">{formatMatic(estimate.totalCost.fast)} MATIC</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet Info */}
              {wallet && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">WALLET BALANCE</p>
                  <div className="bg-dark-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Available</span>
                      <span className="text-white font-bold">{formatMatic(wallet.balance)} MATIC</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 truncate">{wallet.address}</p>
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={fetchEstimate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600/20 text-primary-400 rounded-lg hover:bg-primary-600/30 transition-colors text-sm"
              >
                <HiRefresh className="w-4 h-4" />
                Refresh Estimate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GasEstimator;
