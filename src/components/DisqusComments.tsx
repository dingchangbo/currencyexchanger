import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

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
  useEffect(() => {
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
    const pageIdentifier = identifier;

    // Set configuration function
    window.disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = title;
    };

    // If DISQUS is already loaded on the page, call reset to refresh the thread
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
      } catch (err) {
        console.warn('Disqus reset error:', err);
      }
      return;
    }

    // Embed script injection following the official universal embed code
    const scriptId = 'disqus-embed-script';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptElement) {
      const d = document;
      const s = d.createElement('script');
      s.id = scriptId;
      s.src = 'https://currencyexchange.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      s.async = true;
      (d.head || d.body).appendChild(s);
    }
  }, [identifier, title, url]);

  return (
    <section
      id="section-disqus"
      aria-label="Community Discussion"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
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
