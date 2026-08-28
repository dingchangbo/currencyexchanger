import React, { useEffect, useRef } from 'react';
import { MessageSquare, ShieldCheck, RefreshCw } from 'lucide-react';

interface DisqusCommentsProps {
  identifier?: string;
  title?: string;
  url?: string;
}

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: any) => void;
      }) => void;
    };
    disqus_config?: () => void;
  }
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  identifier = 'currency-exchanger-home',
  title = 'Global Currency Exchanger - Rate Discussions',
  url,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const pageIdentifier = identifier;

    // If DISQUS is already loaded on window, reset with new configuration
    if (typeof window !== 'undefined' && window.DISQUS) {
      try {
        window.DISQUS.reset({
          reload: true,
          config: function (this: any) {
            this.page.identifier = pageIdentifier;
            this.page.url = pageUrl;
            this.page.title = title;
          },
        });
      } catch (e) {
        console.warn('Disqus reset notice:', e);
      }
      return;
    }

    // Configure disqus config before loading embed.js
    window.disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = title;
    };

    // Embed script dynamically
    const scriptId = 'disqus-embed-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const d = document;
      const s = d.createElement('script');
      s.id = scriptId;
      s.src = 'https://test-8izaxa5kmz.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      s.async = true;
      (d.head || d.body).appendChild(s);
    }
  }, [identifier, title, url]);

  const handleReload = () => {
    if (typeof window !== 'undefined' && window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function (this: any) {
          this.page.identifier = identifier;
          this.page.url = url || window.location.href;
          this.page.title = title;
        },
      });
    }
  };

  return (
    <section
      id="section-disqus-community"
      aria-label="Trader Community and Discussions"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Trader Community & Rate Discussions</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Live Disqus Forum
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Share forex market insights, exchange rate forecasts, and order discussions with global traders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleReload}
              title="Reload Discussion Thread"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Thread</span>
            </button>
          </div>
        </div>

        {/* Disqus Thread Container */}
        <div ref={containerRef} className="mt-6 min-h-[220px]">
          <div id="disqus_thread" className="w-full"></div>
          <noscript>
            Please enable JavaScript to view the{' '}
            <a href="https://disqus.com/?ref_noscript" className="text-blue-600 underline">
              comments powered by Disqus.
            </a>
          </noscript>
        </div>
      </div>
    </section>
  );
};
