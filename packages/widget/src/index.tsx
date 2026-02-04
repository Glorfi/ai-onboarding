import { render } from 'preact';
import { App } from '@/components/App';
import type { WidgetConfig } from '@/types';
import '@/styles/main.css';

declare global {
  interface Window {
    __WIDGET_CSS__?: string;
  }
}

function initWidget(): void {
  const script = document.currentScript as HTMLScriptElement | null;

  if (!script) {
    console.error('[OnboardingWidget] Script element not found');
    return;
  }

  const apiKey = script.getAttribute('data-api-key');
  if (!apiKey) {
    console.error('[OnboardingWidget] data-api-key attribute is required');
    return;
  }

  const config: WidgetConfig = {
    apiKey,
    apiUrl: script.getAttribute('data-api-url') || window.location.origin,
    teaserDelay: parseInt(
      script.getAttribute('data-teaser-delay') || '3000',
      10,
    ),
    companyName: script.getAttribute('data-company-name') || undefined,
  };

  // Create host element
  const host = document.createElement('div');
  host.id = 'onboarding-widget-host';
  document.body.appendChild(host);

  // Attach Shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject CSS collected by cssToGlobalVarPlugin into shadow root
  if (window.__WIDGET_CSS__) {
    const style = document.createElement('style');
    style.textContent = window.__WIDGET_CSS__;
    shadow.appendChild(style);
  }

  // Create inner root for CSS variable selectors to work
  const root = document.createElement('div');
  root.id = 'onboarding-widget-root';
  root.className = 'onboarding-widget-root';
  shadow.appendChild(root);

  // Render widget inside Shadow DOM
  render(<App config={config} />, root);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
