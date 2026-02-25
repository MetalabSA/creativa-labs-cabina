import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Partner } from '../types/index';

interface UseBrandingProps {
    partner: Partner | null;
    initialConfig?: any;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useBranding = ({ partner, initialConfig, showToast }: UseBrandingProps) => {
    const [brandingConfig, setBrandingConfig] = useState(initialConfig || {
        primary_color: '#135bec',
        logo_url: '',
        radius: '12px',
        style_presets: ['Superhéroes', 'John Wick', 'Urbano']
    });

    // Sync with initialConfig when it changes (e.g. after initial load)
    useEffect(() => {
        if (initialConfig) {
            setBrandingConfig(initialConfig);
        }
    }, [initialConfig]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const toggleStylePreset = useCallback((style: string) => {
        setBrandingConfig(prev => ({
            ...prev,
            style_presets: prev.style_presets.includes(style)
                ? prev.style_presets.filter(s => s !== style)
                : [...prev.style_presets, style]
        }));
    }, []);

    const handleUpdateBranding = async () => {
        if (!partner) return;
        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('partners')
                .update({ config: brandingConfig })
                .eq('id', partner.id);

            if (error) throw error;
            showToast('¡Configuración sincronizada con éxito! ✨');
            return true;
        } catch (error: any) {
            console.error('Error updating branding:', error);
            showToast('Error al guardar: ' + error.message, 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !partner) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${partner.id}-${Date.now()}.${fileExt}`;

        try {
            setIsUploading(true);
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(fileName, file);

            if (uploadError) {
                // Fallback to 'public' bucket if 'logos' fails (common in some setups)
                const { error: publicError } = await supabase.storage
                    .from('public')
                    .upload(`logos/${fileName}`, file);

                if (publicError) throw uploadError;

                const { data } = supabase.storage.from('public').getPublicUrl(`logos/${fileName}`);
                setBrandingConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
            } else {
                const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
                setBrandingConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
            }
            showToast('Logo subido con éxito');
        } catch (error: any) {
            showToast('Error al subir logo: ' + error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return {
        brandingConfig,
        setBrandingConfig,
        isSaving,
        isUploading,
        toggleStylePreset,
        handleUpdateBranding,
        handleLogoUpload
    };
};
