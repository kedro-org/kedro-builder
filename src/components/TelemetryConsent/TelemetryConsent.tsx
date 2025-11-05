import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  hasSeenConsentBanner,
  markConsentBannerShown,
} from '../../utils/telemetry';
import './TelemetryConsent.scss';

/**
 * TelemetryConsent Banner Component
 *
 * OPT-OUT MODEL:
 * - Telemetry is ENABLED by default
 * - This banner INFORMS users that data is being collected
 * - Users can opt out via Settings menu
 * - Only shows once on first visit
 *
 * Features:
 * - Only shows once (on first visit)
 * - Purely informational: tells users telemetry is active
 * - "OK" button dismisses banner (telemetry stays on)
 * - Users directed to Settings to change preference
 * - Stores "seen" status in localStorage
 */
export const TelemetryConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't seen banner before (regardless of consent state)
    // Since telemetry is ON by default, we just need to inform users
    if (!hasSeenConsentBanner()) {
      // Small delay to avoid showing immediately on app load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleOK = () => {
    // User acknowledges telemetry - keep it enabled
    markConsentBannerShown();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Dismissing keeps telemetry enabled (opt-out model)
    markConsentBannerShown();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="telemetry-consent">
      <div className="telemetry-consent__container">
        <button
          className="telemetry-consent__close"
          onClick={handleDismiss}
          aria-label="Dismiss consent banner"
          data-heap-redact-text
        >
          <X size={20} />
        </button>

        <div className="telemetry-consent__content">
          <h3 className="telemetry-consent__title">Help us improve Kedro Builder</h3>
          <p className="telemetry-consent__description" data-heap-redact-text>
            We are collecting anonymous usage data to help improve Kedro Builder. We only
            track behavioral data like clicks and counts - never your project names, node names,
            or any other personal information.
          </p>
          <p className="telemetry-consent__privacy" data-heap-redact-text>
            You can change this preference at any time in Settings.
          </p>
        </div>

        <div className="telemetry-consent__actions">
          <button
            className="telemetry-consent__button telemetry-consent__button--accept"
            onClick={handleOK}
            data-heap-redact-text
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
