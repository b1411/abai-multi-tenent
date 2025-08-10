import { useBranding } from "../hooks/useSystem";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BrandingSettings } from '../types/system';
import { BrandingContext } from "../contexts/BrandingContext";

interface BrandingProviderProps {
    children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
    const { settings, loading, updateSettings, uploadLogo, uploadFavicon } = useBranding();
    const [appliedBranding, setAppliedBranding] = useState<BrandingSettings | null>(null);

    const applyBrandingToDocument = useCallback((branding: BrandingSettings) => {
        const root = document.documentElement;

        // Применяем цвета как CSS переменные
        if (branding.primaryColor) {
            const primaryRgb = hexToRgb(branding.primaryColor);

            root.style.setProperty('--primary-color', branding.primaryColor);
            root.style.setProperty('--primary-rgb', primaryRgb);
            root.style.setProperty('--primary-50', `${branding.primaryColor}0D`); // 5% opacity
            root.style.setProperty('--primary-100', `${branding.primaryColor}1A`); // 10% opacity
            root.style.setProperty('--primary-500', branding.primaryColor);
            root.style.setProperty('--primary-600', adjustBrightness(branding.primaryColor, -20));
            root.style.setProperty('--primary-700', adjustBrightness(branding.primaryColor, -40));
        }

        if (branding.secondaryColor) {
            root.style.setProperty('--secondary-color', branding.secondaryColor);
        }

        if (branding.accentColor) {
            root.style.setProperty('--accent-color', branding.accentColor);
        }

        // Применяем шрифт
        if (branding.fontFamily) {
            const fontStack = `${branding.fontFamily}, sans-serif`;
            root.style.setProperty('--font-family', fontStack);

            // Применяем шрифт к основным элементам
            document.documentElement.style.fontFamily = fontStack;
            document.body.style.fontFamily = fontStack;

            // Применяем шрифт ко всем элементам
            const style = document.createElement('style');
            style.textContent = `
        * {
          font-family: ${fontStack} !important;
        }
        body, html {
          font-family: ${fontStack} !important;
        }
        .font-sans {
          font-family: ${fontStack} !important;
        }
      `;

            // Удаляем предыдущий стиль, если есть
            const existingStyle = document.getElementById('branding-font-style');
            if (existingStyle) {
                existingStyle.remove();
            }

            style.id = 'branding-font-style';
            document.head.appendChild(style);
        }

        // Обновляем favicon
        if (branding.favicon) {
            updateFavicon(branding.favicon);
        }

        // Обновляем title с названием школы
        if (branding.schoolName) {
            document.title = `${branding.schoolName} - Система управления`;
        }
    }, []);

    // Применяем настройки брендинга к документу
    useEffect(() => {
        if (settings) {
            setAppliedBranding(settings);
            applyBrandingToDocument(settings);
        }
    }, [settings, applyBrandingToDocument]);

    const hexToRgb = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '0, 0, 0';
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    };

    const adjustBrightness = (color: string, percent: number): string => {
        // Простая функция для затемнения/осветления цвета
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    };

    const updateFavicon = (faviconUrl: string) => {
        // Удаляем старый favicon
        const existingFavicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (existingFavicon) {
            existingFavicon.href = faviconUrl;
        } else {
            // Создаем новый favicon
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/x-icon';
            favicon.href = faviconUrl;
            document.head.appendChild(favicon);
        }
    };

    const handleUpdateBranding = async (newSettings: Partial<BrandingSettings>) => {
        const updated = await updateSettings(newSettings);
        if (updated) {
            applyBrandingToDocument(updated);
        }
    };

    const handleUploadLogo = async (file: File) => {
        const url = await uploadLogo(file);
        // Сохраняем URL в настройках брендинга
        await handleUpdateBranding({ logo: url });
        return url;
    };

    const handleUploadFavicon = async (file: File) => {
        const url = await uploadFavicon(file);
        await handleUpdateBranding({ favicon: url });
        return url;
    };

    return (
        <BrandingContext.Provider
            value={{
                branding: appliedBranding,
                loading,
                updateBranding: handleUpdateBranding,
                uploadLogo: handleUploadLogo,
                uploadFavicon: handleUploadFavicon
            }}
        >
            {children}
        </BrandingContext.Provider>
    );
};
