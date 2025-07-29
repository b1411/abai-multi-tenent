import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandingSettings } from '../types/system';

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
  updateBranding: (settings: Partial<BrandingSettings>) => Promise<void>;
}

export const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBrandingContext = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
};
