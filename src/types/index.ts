export interface Partner {
    id: string;
    name: string;
    company_name?: string;
    email?: string;
    credits_total: number;
    credits_used: number;
    is_active?: boolean;
    is_virtual?: boolean;
    config: {
        primary_color: string;
        logo_url: string | null;
        radius?: string;
        style_presets?: string[];
    };
}

export interface Event {
    id: string;
    partner_id?: string;
    event_name: string;
    event_slug: string;
    client_email?: string;
    client_id?: string;
    start_date: string;
    end_date: string;
    credits_allocated: number;
    credits_used: number;
    is_active: boolean;
    created_at?: string;
    selected_styles?: string[];
    config?: any;
}

export interface Client {
    id: string;
    partner_id: string;
    name: string;
    email: string;
    contact_person: string;
    phone: string;
    credits_total: number;
    credits_used: number;
    contracted_styles: string[];
    config: any;
    created_at: string;
}

export interface Log {
    id: string;
    partner_id?: string;
    event_id?: string;
    user_id?: string;
    user_email?: string;
    action: string;
    details: any;
    api_cost?: number;
    created_at: string;
}

export interface Photo {
    id: string;
    event_id: string;
    image_url: string;
    created_at: string;
    prompt?: string;
    style?: string;
}
