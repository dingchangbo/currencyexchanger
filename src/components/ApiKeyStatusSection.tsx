import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Copy, Check, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Server, ShieldCheck, ExternalLink } from 'lucide-react';

interface EnvStatusData {
  variableName: string;
  isConfigured: boolean;
  resolvedValue: string;
  maskedValue: string;
  fullValue: string;
  keyLength: number;
  resolvedSource: string;
  runtime: {
    platform: string;
    nodeEnv: string;
    serverTime: string;
  };
  sampleCurl: string;
}

interface ApiKeyStatusSectionProps {
  onRefreshRate?: () => void;
}

export const ApiKeyStatusSection: React.FC<ApiKeyStatusSectionProps> = ({ onRefreshRate }) => {
  const [envData, setEnvData] = useState<EnvStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    message: string;
    latencyMs?: number;
  }>({ status: 'idle', message: '' });

  const fetchEnvStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/env-status?reveal=true');
      if (res.ok) {
        const data: EnvStatusData = await res.json();
        setEnvData(data);
      }
    } catch (err) {
      console.error('Failed to load environment status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvStatus();
  }, []);

  const handleTestKey = async () => {
    setTestResult({ status: 'testing', message: 'Testing ALPHAVANTAGE_API_KEY with live Alpha Vantage API...' });
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.realtimeApi?.working) {
          setTestResult({
            status: 'success',
            message: `Connected successfully! Sample USD/SGD rate: ${data.realtimeApi.sampleRateData?.exchangeRate || 'Active'} (${data.realtimeApi.latencyMs}ms)`,
            latencyMs: data.realtimeApi.latencyMs,
          });
        } else {
          setTestResult({
            status: 'failed',
            message: data.realtimeApi?.message || 'Alpha Vantage returned rate limit or error.',
            latencyMs: data.realtimeApi?.latencyMs,
          });
        }
      } else {
        setTestResult({ status: 'failed', message: `Server returned HTTP ${res.status}` });
      }
    } catch (err: any) {
      setTestResult({ status: 'failed', message: err.message || 'Network test failed' });
    }
    if (onRefreshRate) onRefreshRate();
  };

  const handleCopyKey = () => {
    if (!envData?.fullValue) return;
    navigator.clipboard.writeText(envData.fullValue);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCurl = () => {
    if (!envData?.sampleCurl) return;
    navigator.clipboard.writeText(envData.sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const displayValue = showFullKey
    ? (envData?.fullValue || '(not set)')
    : (envData?.maskedValue || '••••••••••••••••');

  return (
    <section
      id="section-alphavantage-apikey-status"
      aria-label="AlphaVantage API Key Environment Variable"
      className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 my-6 transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Environment Variable:{' '}
                <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  ALPHAVANTAGE_API_KEY
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live server environment configuration and Alpha Vantage API credential monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              envData?.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {envData?.isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Variable Loaded</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Not Set (Using Demo)</span>
              </>
            )}
          </span>

          <button
            id="btn-refresh-env-status"
            type="button"
            onClick={fetchEnvStatus}
            disabled={isLoading}
            title="Reload Environment Variables"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Printout Content */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Value Box */}
        <div className="lg:col-span-2 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                Variable Value (process.env.ALPHAVANTAGE_API_KEY)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullKey(!showFullKey)}
                  className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  {showFullKey ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Value</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Full Key</span>
                    </>
                  )}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  disabled={!envData?.fullValue}
                  className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Value</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-slate-900 text-slate-100 font-mono text-sm px-3.5 py-3 rounded-xl border border-slate-800 flex items-center justify-between overflow-x-auto selection:bg-blue-500 selection:text-white">
                <span className="tracking-wide select-all break-all">
                  {displayValue}
                </span>
                {envData?.keyLength ? (
                  <span className="shrink-0 ml-3 text-[11px] font-sans px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {envData.keyLength} chars
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Test & Verification Row */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Connection Verification:</span> Test Alpha Vantage API using this key.
              </div>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testResult.status === 'testing'}
                className="bg-[#0a2540] hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Alpha Vantage API Key</span>
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`mt-2.5 p-2.5 rounded-lg text-xs font-mono border ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : testResult.status === 'testing'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Environment Metadata & Details */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-600 font-sans">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
            <Server className="w-3.5 h-3.5 text-blue-600" />
            <span>Environment Details</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Variable:</span>
            <span className="font-mono font-bold text-slate-900">ALPHAVANTAGE_API_KEY</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Resolved From:</span>
            <span className="font-mono text-slate-800 text-[11px] truncate max-w-[170px]" title={envData?.resolvedSource}>
              {envData?.resolvedSource || 'process.env'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Platform:</span>
            <span className="font-medium text-slate-800">{envData?.runtime?.platform || 'Node.js'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Node Environment:</span>
            <span className="font-mono text-slate-800">{envData?.runtime?.nodeEnv || 'development'}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-slate-500">Need a free API key?</span>
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
