import React, { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: any) => void;
      }) => void;
    };
    disqus_config?: (this: any) => void;
  }
}

export const DisqusComments: React.FC = () => {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'blocked'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoadStatus('loading');

    // 1. Configure Disqus
    window.disqus_config = function (this: any) {
      if (typeof window !== 'undefined') {
        this.page.url = window.location.href.split('#')[0];
        this.page.identifier = 'currency-exchanger-thread';
      }
    };

    // 2. Function to load or reload Disqus
    const loadDisqus = () => {
      const thread = document.getElementById('disqus_thread');
      if (!thread) return;

      if (window.DISQUS) {
        try {
          window.DISQUS.reset({
            reload: true,
            config: function (this: any) {
              this.page.url = window.location.href.split('#')[0];
              this.page.identifier = 'currency-exchanger-thread';
            },
          });
          setLoadStatus('loaded');
        } catch (e) {
          console.warn('Disqus reset error:', e);
        }
        return;
      }

      // Remove existing script if any to allow fresh execution
      const existing = document.getElementById('disqus-embed-script');
      if (existing) {
        existing.remove();
      }

      const d = document;
      const s = d.createElement('script');
      s.id = 'disqus-embed-script';
      s.src = 'https://test-8izaxa5kmz.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      s.async = true;

      s.onload = () => {
        setLoadStatus('loaded');
      };

      s.onerror = () => {
        setLoadStatus('blocked');
      };

      (d.head || d.body).appendChild(s);
    };

    // Ensure DOM element is mounted before calling loader
    const timer = setTimeout(loadDisqus, 100);

    // Ad blocker / network blocker detector fallback check
    const checker = setTimeout(() => {
      const thread = document.getElementById('disqus_thread');
      const hasIframe = thread && thread.querySelector('iframe');
      if (!hasIframe && !window.DISQUS) {
        setLoadStatus('blocked');
      } else {
        setLoadStatus('loaded');
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(checker);
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <section
      id="section-disqus"
      aria-label="Disqus Community Comments"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Trader Community Discussion</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Live Disqus Forum
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Discuss currency trends, exchange rate predictions, and forex insights powered by Disqus (<code>test-8izaxa5kmz</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRetry}
              title="Reload Disqus comments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Thread</span>
            </button>

            <a
              href="https://test-8izaxa5kmz.disqus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a2540] hover:bg-slate-800 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <span>Open in Disqus</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Adblock / Iframe Sandbox Notice (Only displays if browser / adblock prevents embed.js) */}
        {loadStatus === 'blocked' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Notice:</span> If comments are taking long or blocked by your browser ad-blocker / privacy shields (e.g. Brave Shields or uBlock), you can access the forum thread directly or disable shield for this site.
              </div>
            </div>
            <a
              href="https://test-8izaxa5kmz.disqus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:underline shrink-0"
            >
              <span>Visit test-8izaxa5kmz.disqus.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Official Disqus Thread Container */}
        <div id="disqus_thread" className="w-full min-h-[180px]"></div>

        <noscript>
          Please enable JavaScript to view the{' '}
          <a href="https://disqus.com/?ref_noscript" className="text-blue-600 underline">
            comments powered by Disqus.
          </a>
        </noscript>
      </div>
    </section>
  );
};


