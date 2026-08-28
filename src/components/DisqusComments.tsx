import React, { useEffect, useRef } from 'react';
import { MessageSquare, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';

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
    disqus_config?: (this: any) => void;
  }
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  identifier = 'currency-exchanger-global',
  title = 'Global Currency Exchanger Discussion',
  url,
}) => {
  const isFirstMount = useRef(true);

  useEffect(() => {
    const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
    const threadId = identifier;

    // Define disqus configuration
    window.disqus_config = function (this: any) {
      this.page.url = canonicalUrl;
      this.page.identifier = threadId;
      this.page.title = title;
    };

    // If DISQUS already exists on window, execute reset
    if (typeof window !== 'undefined' && window.DISQUS) {
      try {
        window.DISQUS.reset({
          reload: true,
          config: function (this: any) {
            this.page.url = canonicalUrl;
            this.page.identifier = threadId;
            this.page.title = title;
          },
        });
      } catch (err) {
        console.warn('Disqus reset notice:', err);
      }
      return;
    }

    // Embed script injection (Universal Code)
    const scriptId = 'disqus-embed-script';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptElement) {
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
    if (typeof window !== 'undefined') {
      const canonicalUrl = url || window.location.href.split('#')[0];
      if (window.DISQUS) {
        try {
          window.DISQUS.reset({
            reload: true,
            config: function (this: any) {
              this.page.url = canonicalUrl;
              this.page.identifier = identifier;
              this.page.title = title;
            },
          });
        } catch (e) {
          console.warn('Disqus reload failed:', e);
        }
      } else {
        const s = document.createElement('script');
        s.src = 'https://test-8izaxa5kmz.disqus.com/embed.js';
        s.setAttribute('data-timestamp', String(+new Date()));
        (document.head || document.body).appendChild(s);
      }
    }
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
                Share forex market insights, currency forecast discussions, and rate feedback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleReload}
              title="Reload Disqus comments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Thread</span>
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

        {/* Official Disqus Thread Container */}
        <div id="disqus_thread" className="w-full min-h-[220px]"></div>

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
