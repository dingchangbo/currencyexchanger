import React, { useEffect, useState } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

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
  identifier = 'currencyexchange-global',
  title = 'Currency Exchange Community',
  url,
}) => {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    try {
      const pageUrl = url || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
      const pageIdentifier = identifier;

      // Define disqus configuration
      window.disqus_config = function (this: any) {
        this.page.url = pageUrl;
        this.page.identifier = pageIdentifier;
        this.page.title = title;
      };

      // If DISQUS already exists on window, execute reset
      if (typeof window !== 'undefined' && window.DISQUS) {
        try {
          window.DISQUS.reset({
            reload: true,
            config: function (this: any) {
              this.page.url = pageUrl;
              this.page.identifier = pageIdentifier;
              this.page.title = title;
            },
          });
        } catch {
          // Keep silent on transient resets
        }
        return;
      }

      // Universal embed script injection
      const scriptId = 'disqus-embed-script';
      let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!scriptElement) {
        const d = document;
        const s = d.createElement('script');
        s.id = scriptId;
        s.src = 'https://currencyexchange.disqus.com/embed.js';
        s.setAttribute('data-timestamp', String(+new Date()));
        s.async = true;
        s.onerror = () => setLoadError(true);
        (d.head || d.body).appendChild(s);
      }
    } catch {
      setLoadError(true);
    }
  }, [identifier, title, url]);

  return (
    <section
      id="section-disqus"
      aria-label="Community Discussion"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Discussion</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Join the conversation with other traders and currency market participants.
              </p>
            </div>
          </div>

          <a
            href="https://currencyexchange.disqus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors w-fit"
          >
            <span>Open Forum</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Official Disqus Thread Container */}
        <div id="disqus_thread" className="w-full min-h-[220px]">
          {loadError && (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <p>Disqus comments embed is blocked or protected by your browser settings.</p>
              <a
                href="https://currencyexchange.disqus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
              >
                Open currencyexchange forum directly <ExternalLink className="w-3 h-3" />
              </a>
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
