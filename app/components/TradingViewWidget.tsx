'use client';

import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
    symbol?: string;
    width?: string | number;
    height?: string | number;
}

export default function TradingViewWidget({
    symbol = 'FX:USDJPY',
    width = '100%',
    height = 500
}: TradingViewWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: false,
            symbol: symbol,
            interval: '15',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            gridColor: 'rgba(42, 46, 57, 0.06)',
            allow_symbol_change: true,
            save_image: false,
            calendar: false,
            support_host: 'https://www.tradingview.com',
            width: width,
            height: height,
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, width, height]);

    return (
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}
