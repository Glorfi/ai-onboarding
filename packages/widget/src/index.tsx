import { render } from 'preact';
import { App } from '@/components/App';
import type { WidgetConfig } from '@/types';
import '@/styles/main.css';

function initWidget(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  console.log("Пиздца");
  
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
    teaserDelay: parseInt(script.getAttribute('data-teaser-delay') || '3000', 10),
    companyName: script.getAttribute('data-company-name') || undefined,
  };

  // Create root container
  const container = document.createElement('div');
  container.id = 'onboarding-widget-root';
  container.style.cssText = 'position: fixed; z-index: 9999; pointer-events: none;';
  document.body.appendChild(container);

  // Render widget
  render(<App config={config} />, container);

  // Make all children receive pointer events
  container.style.pointerEvents = 'auto';
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
