'use client';

import { useEffect } from 'react';
import { initFrontendMonitoring } from '@/lib/monitoring';

export default function MonitoringProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initFrontendMonitoring();
  }, []);

  return <>{children}</>;
}
