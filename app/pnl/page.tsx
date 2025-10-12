"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { AsOfDateSelect } from "@/components/filters/as-of-date-select";
import { RiskFilter } from "@/components/filters/risk-filter";
import { pnlFilterConfig } from "@/components/filters/pnl-filter.config";
import { useStore } from "@tanstack/react-store";
import { filtersStore } from "@/lib/store/filters";

const LAZY_LOAD_DELAY = 1500;

export default function PnLPage() {
  const filters = useStore(filtersStore, (state) => state.filters);
  const asOfDate = useStore(filtersStore, (state) => state.asOfDate);

  const [showLazyContent, setShowLazyContent] = useState(false);
  const [isLoadingLazy, setIsLoadingLazy] = useState(false);
  const lazyTriggerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredLazyLoadRef = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);

  const triggerLazyLoad = useCallback(() => {
    if (hasTriggeredLazyLoadRef.current || showLazyContent) {
      return;
    }

    hasTriggeredLazyLoadRef.current = true;
    setIsLoadingLazy(true);

    loadTimeoutRef.current = window.setTimeout(() => {
      setShowLazyContent(true);
      setIsLoadingLazy(false);
      loadTimeoutRef.current = null;
    }, LAZY_LOAD_DELAY);
  }, [showLazyContent]);

  useEffect(() => {
    if (showLazyContent) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          triggerLazyLoad();
        }
      },
      {
        rootMargin: "100px",
      }
    );

    const trigger = lazyTriggerRef.current;
    if (trigger) {
      observer.observe(trigger);

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= viewportHeight) {
        triggerLazyLoad();
      }
    }

    return () => {
      observer.disconnect();
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [showLazyContent, triggerLazyLoad]);

  return (
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Performance Frontview</h2>
        <div className="flex items-center gap-3">
          <RiskFilter
            tableName={pnlFilterConfig.tableName}
            filterTypes={pnlFilterConfig.filterTypes}
            filterOperators={pnlFilterConfig.filterOperators}
            iconMapping={pnlFilterConfig.iconMapping}
            operatorConfig={pnlFilterConfig.operatorConfig}
            dateValues={pnlFilterConfig.dateValues}
          />
          <AsOfDateSelect tableName={pnlFilterConfig.tableName} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Add your content here */}

        <div ref={lazyTriggerRef} className="h-10" />

        {isLoadingLazy && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Loading additional content...
              </span>
            </div>
          </div>
        )}

        {showLazyContent && (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            {/* Add your lazy-loaded content here */}
          </div>
        )}
      </div>
    </div>
  );
}
