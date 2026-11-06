import { useEffect, useState } from 'react';
import {
  CUSTOMER_DISPLAY_CHANNEL,
  CUSTOMER_DISPLAY_STORAGE_KEY,
  idleSnapshot,
  readCustomerDisplaySnapshot,
} from './customerDisplayChannel';

export function useCustomerDisplayFeed() {
  const [snapshot, setSnapshot] = useState(() => readCustomerDisplaySnapshot());

  useEffect(() => {
    setSnapshot(readCustomerDisplaySnapshot());

    let channel;
    const onMessage = (event) => {
      if (event?.data && typeof event.data === 'object') {
        setSnapshot({ ...idleSnapshot(event.data.storeName), ...event.data });
      }
    };
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
        channel.addEventListener('message', onMessage);
      }
    } catch {
      channel = null;
    }

    const onStorage = (event) => {
      if (event.key !== CUSTOMER_DISPLAY_STORAGE_KEY) return;
      setSnapshot(readCustomerDisplaySnapshot());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (channel) {
        channel.removeEventListener('message', onMessage);
        channel.close();
      }
    };
  }, []);

  return snapshot;
}
