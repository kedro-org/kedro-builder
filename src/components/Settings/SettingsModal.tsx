import { useState, useEffect } from 'react';
import { X, Moon, Sun, BarChart3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../features/theme/themeSlice';
import { getTelemetryConsent, setTelemetryConsent } from '../../infrastructure/telemetry';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings Modal Component
 *
 * Centralized settings panel for:
 * - Theme selection (light/dark)
 * - Analytics/telemetry preferences
 *
 * Changes to telemetry settings will reload the page to load/unload Heap.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Load current telemetry consent status
    setAnalyticsEnabled(getTelemetryConsent());
  }, [isOpen]);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleAnalyticsToggle = () => {
    const newValue = !analyticsEnabled;
    setAnalyticsEnabled(newValue);
    setTelemetryConsent(newValue); // This will reload the page
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="settings-modal" onClick={handleOverlayClick}>
      <div className="settings-modal__content">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">Settings</h2>
          <button
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
            data-heap-redact-text
          >
            <X size={24} />
          </button>
        </div>

        <div className="settings-modal__body">
          {/* Theme Section */}
          <section className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div className="settings-section__info">
                <h3 className="settings-section__title">Theme</h3>
                <p className="settings-section__description" data-heap-redact-text>
                  Choose your preferred color theme
                </p>
              </div>
            </div>
            <div className="settings-section__control">
              <button
                className={`settings-toggle ${theme === 'dark' ? 'settings-toggle--active' : ''}`}
                onClick={handleThemeToggle}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                data-heap-redact-text
              >
                <span className="settings-toggle__option">Light</span>
                <span className="settings-toggle__option">Dark</span>
                <span className="settings-toggle__slider" />
              </button>
            </div>
          </section>

          {/* Analytics Section */}
          <section className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <BarChart3 size={20} />
              </div>
              <div className="settings-section__info">
                <h3 className="settings-section__title">Analytics</h3>
                <p className="settings-section__description" data-heap-redact-text>
                  Help us improve Kedro Builder by sharing anonymous usage data. We only track
                  behavioral data like clicks and counts - never your project names, node names,
                  or any other personal information.
                </p>
              </div>
            </div>
            <div className="settings-section__control">
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={handleAnalyticsToggle}
                  data-heap-redact-attributes
                />
                <span className="settings-switch__slider" />
              </label>
            </div>
          </section>

          {/* Info Note */}
          <div className="settings-modal__note" data-heap-redact-text>
            <p>
              Note: Changing analytics settings will reload the page to apply changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
