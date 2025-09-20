// Хук для получения и переключения tenant-конфига

import { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../services/apiClient';

export function useTenantConfig(initialTenant: string = 'tenant1') {
  const [tenant, setTenant] = useState(initialTenant);
  const [config, setConfig] = useState<{ periodType?: 'quarter' | 'semester'; gradeSystem?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get<{
      periodType: 'quarter' | 'semester';
      gradeSystem: number;
    }>(`tenant-config?tenant=${tenant}`)
      .then(res => {
        // Приводим gradeSystem к числу
        const cfg = res || {};
        if (cfg.gradeSystem !== undefined) {
          cfg.gradeSystem = Number(cfg.gradeSystem) || 5;
        }
        setConfig(cfg);
      })
      .finally(() => setLoading(false));
  }, [tenant]);

  return { tenant, setTenant, config, loading };
}
