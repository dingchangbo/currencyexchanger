import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

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
    disqus_shortname?: string;
  }
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  identifier = 'currencyexchange-global',
  title = 'Currency Exchange Community',
  url,
}) => {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'blocked'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);

  const initDisqus = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const pageUrl =
        url ||
        (window.location.origin
          ? `${window.location.origin}${window.location.pathname}#!${identifier}`
          : window.location.href);

      window.disqus_shortname = 'currencyexchange';

      // Set global configuration callback
      window.disqus_config = function (this: any) {
        this.page.url = pageUrl;
        this.page.identifier = identifier;
        this.page.title = title;
      };

      // If Disqus is already loaded, reset the thread with new metadata
      if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
        try {
          window.DISQUS.reset({
            reload: true,
            config: function (this: any) {
              this.page.url = pageUrl;
              this.page.identifier = identifier;
              this.page.title = title;
            },
          });
          if (isMountedRef.current) {
            setLoadStatus('loaded');
          }
        } catch (err) {
          console.warn('Disqus reset notice:', err);
        }
        return;
      }

      // Check if script already exists in document
      const scriptId = 'dsq-embed-scr';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://currencyexchange.disqus.com/embed.js';
        script.setAttribute('data-timestamp', String(+new Date()));
        script.async = true;

        script.onload = () => {
          if (isMountedRef.current) {
            setLoadStatus('loaded');
          }
        };

        script.onerror = () => {
          if (isMountedRef.current) {
            setLoadStatus('blocked');
          }
        };

        (document.head || document.body).appendChild(script);
      } else {
        // Script was already in DOM; wait slightly for DISQUS global to be ready
        const timeout = setTimeout(() => {
          if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
            try {
              window.DISQUS.reset({
                reload: true,
                config: function (this: any) {
                  this.page.url = pageUrl;
                  this.page.identifier = identifier;
                  this.page.title = title;
                },
              });
              if (isMountedRef.current) setLoadStatus('loaded');
            } catch (e) {
              console.warn(e);
            }
          }
        }, 300);

        return () => clearTimeout(timeout);
      }
    } catch (err) {
      console.warn('Disqus embed init error:', err);
      if (isMountedRef.current) {
        setLoadStatus('blocked');
      }
    }
  }, [identifier, title, url]);

  useEffect(() => {
    isMountedRef.current = true;
    initDisqus();

    // Fallback timer: if still loading after 4 seconds, mark as loaded or ready
    const timer = setTimeout(() => {
      if (isMountedRef.current && loadStatus === 'loading') {
        const thread = document.getElementById('disqus_thread');
        if (thread && thread.children.length > 0) {
          setLoadStatus('loaded');
        }
      }
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [initDisqus, retryCount]);

  const handleManualRetry = () => {
    setLoadStatus('loading');
    const existing = document.getElementById('dsq-embed-scr');
    if (existing) {
      existing.remove();
    }
    setRetryCount((prev) => prev + 1);
  };

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

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-disqus"
              onClick={handleManualRetry}
              title="Reload comments thread"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Thread</span>
            </button>

            <a
              id="btn-open-disqus-forum"
              href="https://currencyexchange.disqus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-700 border border-blue-200 transition-colors"
            >
              <span>Open in Disqus</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Notice if privacy shields or ad-blockers block third-party comment iframe */}
        {loadStatus === 'blocked' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Disqus comments embed might be blocked by browser content settings</p>
              <p>
                Ad-blockers, Brave Shields, or strict tracking prevention may restrict third-party comment widgets. You can click{' '}
                <button onClick={handleManualRetry} className="underline font-semibold hover:text-amber-900">
                  Reload Thread
                </button>{' '}
                or open the discussion forum directly at{' '}
                <a
                  href="https://currencyexchange.disqus.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-blue-700"
                >
                  currencyexchange.disqus.com
                </a>.
              </p>
            </div>
          </div>
        )}

        {/* Official Target Container: DO NOT put React JSX children directly inside this element */}
        <div id="disqus_thread" className="w-full min-h-[260px]"></div>

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
