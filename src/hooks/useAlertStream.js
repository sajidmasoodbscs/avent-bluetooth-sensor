import { useCallback, useEffect } from 'react';
import { useBle } from '../ble/BleContext';
import { TLV, getAlertLabel } from '../utils/bleProtocol';

const ALERT_TYPE_BY_KEY = {
  occupancy: TLV.OCCUPANCY,
  tilt: TLV.TILT,
  motion: TLV.MOTION,
  syringe: TLV.PRESSURE_ALERT,
};

/**
 * Read push-alert state from BleContext (populated by ALERT characteristic notifications).
 * @param {'occupancy'|'tilt'|'motion'|'syringe'} alertKey
 */
export function useAlertStream(alertKey, active = true) {
  const { latestAlerts, isConnected } = useBle();
  const type = ALERT_TYPE_BY_KEY[alertKey];
  const stateKey = alertKey === 'syringe' ? 'pressureAlert' : alertKey;
  const state = active ? latestAlerts[stateKey] : undefined;
  const label = state != null ? getAlertLabel(type, state) : '—';

  useEffect(() => {
    if (!active || !alertKey) return;
    console.log('[Use case Alert]', { alertKey, state, label, isConnected });
  }, [active, alertKey, state, label, isConnected]);

  const reset = useCallback(() => {
    // Alerts are device-driven; reset is a no-op unless firmware re-sends on change.
  }, []);

  return {
    alertKey,
    state,
    label,
    isConnected,
    isRunning: true,
    setIsRunning: () => {},
    reset,
    useDummy: false,
  };
}
