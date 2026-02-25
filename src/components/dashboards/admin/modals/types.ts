export interface Partner {
    id: string;
    name?: string;
    company_name?: string;
    contact_email: string;
    contact_phone?: string;
    is_active?: boolean;
    eventCount?: number;
    activeEvents?: number;
    credits_total: number;
    credits_used: number;
    config?: any;
    user_id?: string;
    is_from_profile?: boolean;
}

export interface UserProfile {
    id: string;
    email: string;
    credits: number;
    total_generations: number;
    role: string;
    unlocked_packs?: string[];
    full_name?: string;
    created_at?: string;
}

export interface StyleMetadata {
    id: string;
    label: string;
    category: string;
    subcategory: string;
    image_url: string;
    prompt: string;
    tags: string | string[];
    is_premium: boolean;
    usage_count: number;
    is_active: boolean;
}
