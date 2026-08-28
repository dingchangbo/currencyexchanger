import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: { reload: boolean; config?: () => void }) => void;
    };
    disqus_config?: () => void;
  }
}

interface DisqusCommentsProps {
  identifier?: string;
  title?: string;
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  identifier = 'currency-exchanger-global',
  title = 'Currency Exchanger Community & Market Discussions',
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    try {
      // Define Disqus configuration according to official specs
      window.disqus_config = function (this: any) {
        this.page = this.page || {};
        this.page.url = window.location.href;
        this.page.identifier = identifier;
        this.page.title = title;
      };

      if (window.DISQUS) {
        // If Disqus is already loaded on the page, reset it with the new page info
        window.DISQUS.reset({
          reload: true,
          config: function (this: any) {
            this.page = this.page || {};
            this.page.url = window.location.href;
            this.page.identifier = identifier;
            this.page.title = title;
          },
        });
      } else {
        const existingScript = document.getElementById('disqus-script');
        if (!existingScript) {
          const d = document;
          const s = d.createElement('script');
          s.id = 'disqus-script';
          s.src = 'https://test-8izaxa5kmz.disqus.com/embed.js';
          s.setAttribute('data-timestamp', String(+new Date()));
          s.async = true;
          s.onerror = () => {
            console.warn('Disqus embed script could not be loaded in this sandbox environment.');
            setLoadFailed(true);
          };
          (d.head || d.body).appendChild(s);
        }
      }
    } catch (err) {
      console.warn('Disqus initialization error:', err);
      setLoadFailed(true);
    }
  }, [identifier, title, reloadKey]);

  const handleManualReload = () => {
    setLoadFailed(false);
    const existing = document.getElementById('disqus-script');
    if (existing) {
      existing.remove();
    }
    setReloadKey((prev) => prev + 1);
  };

  return (
    <section
      id="section-disqus"
      aria-label="Community Discussion"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Community Discussion & Market Insights
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Share forex trading ideas, currency forecast opinions, and connect with other market participants.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reload-disqus"
              onClick={handleManualReload}
              title="Reload comments thread"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Thread</span>
            </button>

            <a
              id="btn-disqus-external"
              href="https://disqus.com/home/forums/test-8izaxa5kmz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-700 border border-blue-200 transition-colors"
            >
              <span>Disqus Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Official Target Container */}
        <div id="disqus_thread" className="w-full min-h-[160px]">
          {loadFailed && (
            <div className="p-6 text-center text-slate-600 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-sm text-slate-800">Disqus Community Discussion Channel</p>
              <p className="text-xs text-slate-500 mt-1">
                Comments and discussion forum are ready. (If restricted by browser privacy shields or third-party cookies, you can click "Reload Thread" or open in the Disqus Hub).
              </p>
            </div>
          )}
        </div>

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
