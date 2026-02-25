import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseGenerationProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useGeneration = ({ showToast }: UseGenerationProps) => {
    const [eventPhotos, setEventPhotos] = useState<any[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [moderationLoading, setModerationLoading] = useState(false);

    const fetchEventPhotos = useCallback(async (eventId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('generations')
                .select('*, profiles(email)')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEventPhotos(data || []);
        } catch (err) {
            console.error('Error fetching photos:', err);
            showToast('No se pudieron cargar las fotos', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleDeletePhoto = async (photoId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta foto de la galería?')) return false;
        try {
            const { error } = await supabase.from('generations').delete().eq('id', photoId);
            if (error) throw error;
            setEventPhotos(prev => prev.filter(p => p.id !== photoId));
            setSelectedPhotos(prev => prev.filter(id => id !== photoId));
            showToast('Foto eliminada correctamente');
            return true;
        } catch (err) {
            showToast('Error al eliminar la foto', 'error');
            return false;
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPhotos.length === 0) return;
        if (!window.confirm(`🚨 ACCIÓN MASIVA: ¿Estás seguro de eliminar ${selectedPhotos.length} fotos definitivamente?`)) return;

        try {
            setModerationLoading(true);
            const { error } = await supabase
                .from('generations')
                .delete()
                .in('id', selectedPhotos);

            if (error) throw error;

            showToast(`${selectedPhotos.length} fotos eliminadas`);
            setEventPhotos(prev => prev.filter(p => !selectedPhotos.includes(p.id)));
            setSelectedPhotos([]);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setModerationLoading(false);
        }
    };

    return {
        eventPhotos,
        setEventPhotos,
        loading,
        moderationLoading,
        selectedPhotos,
        setSelectedPhotos,
        fetchEventPhotos,
        handleDeletePhoto,
        handleBulkDelete
    };
};
