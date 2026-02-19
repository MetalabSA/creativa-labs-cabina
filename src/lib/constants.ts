import { Sparkles, Monitor, Layout, Camera } from 'lucide-react';

export const PREFERRED_PACK_ORDER = [
    'La Ley de los Audaces',
    'John Wick',
    'Superhéroes',
    'Peaky Blinders',
    'Breaking Bad',
    'Urbano',
    'Magia'
];

export const IDENTITIES = [
    {
        id: 'f1_a',
        title: 'Red Bull Racing',
        url: '/cabina/F1-A.jpg',
        category: 'sports',
        subCategory: 'Formula 1',
        tags: ['speed', 'f1', 'action', 'professional', 'carrera', 'deporte', 'rojo', 'velocidad', 'auto', 'monaco'],
        isPremium: true
    },
    {
        id: 'f1_b',
        title: 'Ferrari Team',
        url: '/cabina/F1-B.jpg',
        category: 'sports',
        subCategory: 'Formula 1',
        tags: ['speed', 'f1', 'classic', 'racing', 'italia', 'rojo', 'leyenda', 'historico', 'caballino'],
        isPremium: true
    },
    {
        id: 'f1_c',
        title: 'Mercedes AMG',
        url: '/cabina/F1-C.jpg',
        category: 'sports',
        subCategory: 'Formula 1',
        tags: ['modern', 'f1', 'tech', 'silver', 'flecha', 'alemania', 'pro', 'campeon', 'plata'],
        isPremium: true
    },
    {
        id: 'f1_d',
        title: 'Pit Stop Vibe',
        url: '/cabina/F1-D.jpg',
        category: 'sports',
        subCategory: 'Formula 1',
        tags: ['mechanic', 'f1', 'teamwork', 'garage', 'trabajo', 'boxes', 'mecanico', 'equipo'],
        isPremium: true
    },
    {
        id: 'bb_a',
        title: 'The Heisenberg',
        url: '/cabina/BB-A.jpg',
        category: 'series',
        subCategory: 'Breaking Bad',
        tags: ['drama', 'meth', 'hat', 'cinematic', 'pelado', 'quimica', 'drogas', 'sombrero', 'lentes']
    },
    {
        id: 'bb_b',
        title: 'Desert Cook',
        url: '/cabina/BB-B.jpg',
        category: 'series',
        subCategory: 'Breaking Bad',
        tags: ['rv', 'desert', 'yellow', 'gasmask', 'careta', 'cocina', 'arena', 'desierto', 'amarillo']
    },
    {
        id: 'bb_c',
        title: 'Better Call Saul',
        url: '/cabina/BB-C.jpg',
        category: 'series',
        subCategory: 'Breaking Bad',
        tags: ['lawyer', 'suit', 'colorful', 'office', 'abogado', 'traje', 'comedia', 'estafador', 'carcel']
    },
    {
        id: 'bb_d',
        title: 'Los Pollos Hermanos',
        url: '/cabina/BB-D.jpg',
        category: 'series',
        subCategory: 'Breaking Bad',
        tags: ['chicken', 'fried', 'restaurant', 'yellow', 'empleado', 'delantal', 'comida', 'fastfood']
    },
    {
        id: 'suit_a',
        title: 'Harvey Specter',
        url: '/cabina/SUIT-A.jpg',
        category: 'series',
        subCategory: 'La Ley de los Audaces',
        tags: ['law', 'executive', 'expensive', 'classy', 'traje', 'corbata', 'lujo', 'abogado', 'exito']
    },
    {
        id: 'suit_b',
        title: 'Mike Ross Style',
        url: '/cabina/SUIT-B.jpg',
        category: 'series',
        subCategory: 'La Ley de los Audaces',
        tags: ['law', 'young', 'genius', 'bicycle', 'bici', 'mochila', 'bolso', 'joven', 'mensajero']
    },
    {
        id: 'suit_c',
        title: 'Donna Paulsen',
        url: '/cabina/SUIT-C.jpg',
        category: 'series',
        subCategory: 'La Ley de los Audaces',
        tags: ['secretary', 'powerful', 'fashion', 'redhead', 'vestido', 'pelirroja', 'secretaria', 'mujer']
    },
    {
        id: 'suit_d',
        title: 'Pearson Hardman',
        url: '/cabina/SUIT-D.jpg',
        category: 'series',
        subCategory: 'La Ley de los Audaces',
        tags: ['firm', 'luxury', 'office', 'success', 'oficina', 'socios', 'empresa', 'corporativo']
    },
    {
        id: 'pb_a',
        title: 'Thomas Shelby',
        url: '/cabina/PB-A.jpg',
        category: 'series',
        subCategory: 'Peaky Blinders',
        tags: ['gangster', 'vintage', 'cap', 'whiskey', 'boina', 'fuego', 'mafia', 'fumar', 'antiguo'],
        isPremium: true
    },
    {
        id: 'pb_b',
        title: 'Birmingham Streets',
        url: '/cabina/PB-B.jpg',
        category: 'series',
        subCategory: 'Peaky Blinders',
        tags: ['industrial', 'smoke', 'horse', 'family', 'caballo', 'niebla', 'calle', 'oscuro', 'frio'],
        isPremium: true
    },
    {
        id: 'pb_c',
        title: 'Garrison Pub',
        url: '/cabina/PB-C.jpg',
        category: 'series',
        subCategory: 'Peaky Blinders',
        tags: ['bar', 'drink', 'meeting', 'gentlemen', 'trago', 'reunion', 'poker', 'londres', 'taberna'],
        isPremium: true
    },
    {
        id: 'pb_d',
        title: 'The Razor Edge',
        url: '/cabina/PB-D.jpg',
        category: 'series',
        subCategory: 'Peaky Blinders',
        tags: ['razor', 'fight', 'strategy', 'british', 'navaja', 'pelea', 'sangre', 'inglaterra'],
        isPremium: true
    },
    {
        id: 'ph_a',
        title: 'Urban Explorer',
        url: '/cabina/PH-A.jpg',
        category: 'urban',
        subCategory: 'Urbano',
        tags: ['street', 'hoodie', 'city', 'night', 'buchon', 'noche', 'grafiti', 'ciudad', 'capucha']
    },
    {
        id: 'ph_b',
        title: 'Studio Portrait',
        url: '/cabina/PH-B.jpg',
        category: 'urban',
        subCategory: 'Urbano',
        tags: ['clean', 'lighting', 'vogue', 'model', 'estudio', 'flash', 'limpio', 'retrato', 'blanco']
    },
    {
        id: 'ph_c',
        title: 'Neon Life',
        url: '/cabina/PH-C.jpg',
        category: 'urban',
        subCategory: 'Urbano',
        tags: ['color', 'neon', 'asia', 'cyberpunk', 'futuro', 'luces', 'noche', 'tokyo', 'led']
    },
    {
        id: 'ph_d',
        title: 'Vintage Film',
        url: '/cabina/PH-D.jpg',
        category: 'urban',
        subCategory: 'Urbano',
        tags: ['analog', 'grainy', 'retro', '90s', 'rollo', 'sepia', 'viejo', 'fotografia', 'vhs']
    },
    {
        id: 'jhonw_a',
        title: 'Baba Yaga',
        url: '/cabina/jhonw_a.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'accion', 'suit', 'weapons', 'venganza', 'traje', 'asesino', 'perro'],
        isPremium: true
    },
    {
        id: 'jhonw_b',
        title: 'The Continental',
        url: '/cabina/jhonw_b.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'hotel', 'neon', 'mercy', 'noche', 'monedas', 'lujo', 'accion'],
        isPremium: true
    },
    {
        id: 'jhonw_c',
        title: 'High Table Legacy',
        url: '/cabina/jhonw_c.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'trama', 'poder', 'oro', 'consejo', 'elegante', 'noir'],
        isPremium: true
    },
    {
        id: 'jhonw_d',
        title: 'Excommunicado',
        url: '/cabina/jhonw_d.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'escape', 'lluvia', 'recompensa', 'reloj', 'correr', 'persecucion'],
        isPremium: true
    },
    {
        id: 'jhonw_e',
        title: 'Desert Assassin',
        url: '/cabina/jhonw_e.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'desierto', 'arena', 'casablanca', 'calor', 'caballo'],
        isPremium: true
    },
    {
        id: 'jhonw_f',
        title: 'Ballerina Soul',
        url: '/cabina/jhonw_f.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'danza', 'pelea', 'ballet', 'teatro', 'elegancia'],
        isPremium: true
    },
    {
        id: 'jhonw_g',
        title: 'Osaka Night',
        url: '/cabina/jhonw_g.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'japon', 'katana', 'neon', 'rojo', 'samurai'],
        isPremium: true
    },
    {
        id: 'jhonw_h',
        title: 'Last Stand',
        url: '/cabina/jhonw_h.jpg',
        category: 'cinema',
        subCategory: 'John Wick',
        tags: ['john wick', 'final', 'amanecer', 'escaleras', 'paris', 'sacrificio'],
        isPremium: true
    },
    {
        id: 'magic_a',
        title: 'El Gran Mago',
        url: '/cabina/magic_a.jpg',
        category: 'fantasy',
        subCategory: 'Magia',
        tags: ['magia', 'magos', 'cartas', 'ilusion', 'truco', 'chistera', 'misterio', 'humo'],
        isPremium: false
    },
    {
        id: 'magic_b',
        title: 'Ilusión Real',
        url: '/cabina/magic_b.jpg',
        category: 'fantasy',
        subCategory: 'Magia',
        tags: ['magia', 'cartas', 'fuego', 'levitacion', 'misterio', 'show', 'escenario', 'magico'],
        isPremium: false
    },
    {
        id: 'magic_c',
        title: 'Arcane Master',
        url: '/cabina/magic_c.jpg',
        category: 'fantasy',
        subCategory: 'Magia',
        tags: ['magia', 'hechizo', 'runas', 'libro', 'poder', 'energia', 'azul'],
        isPremium: false
    },
    {
        id: 'magic_d',
        title: 'Dark Illusion',
        url: '/cabina/magic_d.jpg',
        category: 'fantasy',
        subCategory: 'Magia',
        tags: ['magia', 'oscuro', 'sombras', 'vudu', 'miedo', 'cuervo'],
        isPremium: false
    },
    {
        id: 'magic_e',
        title: 'Street Magic',
        url: '/cabina/magic_e.jpg',
        category: 'fantasy',
        subCategory: 'Magia',
        tags: ['magia', 'calle', 'moneda', 'mano', 'close up', 'asombro'],
        isPremium: false
    },
    {
        id: 'sup_a',
        title: 'The Avenger',
        url: '/cabina/sup_a.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'ironman', 'avengers', 'tech', 'poder', 'vengadores', 'heroe', 'vuelo'],
        isPremium: true
    },
    {
        id: 'sup_b',
        title: 'Legacy of Thor',
        url: '/cabina/sup_b.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'thor', 'hulk', 'god', 'trueno', 'fuerza', 'martillo', 'epico'],
        isPremium: true
    },
    {
        id: 'sup_c',
        title: 'Cosmic Guardian',
        url: '/cabina/sup_c.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'guardian', 'galaxia', 'estrellas', 'vuelo', 'fuerza'],
        isPremium: true
    },
    {
        id: 'sup_d',
        title: 'Emerald Might',
        url: '/cabina/sup_d.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'hulk', 'fuerza', 'verde', 'destruccion', 'enojo'],
        isPremium: true
    },
    {
        id: 'sup_e',
        title: 'Justice Knight',
        url: '/cabina/sup_e.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'batman', 'noche', 'capa', 'justicia', 'murcielago'],
        isPremium: true
    },
    {
        id: 'sup_f',
        title: 'Knight Alt I',
        url: '/cabina/sup_f.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'variante', 'oscuro', 'armadura'],
        isPremium: true
    },
    {
        id: 'sup_g',
        title: 'Knight Alt II',
        url: '/cabina/sup_g.jpg',
        category: 'cinema',
        subCategory: 'Superhéroes',
        tags: ['superheroes', 'variante', 'tecnologico', 'azul'],
        isPremium: true
    }
];

export const CATEGORIES = [
    { id: 'all', label: 'Todo', icon: Sparkles },
    { id: 'series', label: 'Series', icon: Monitor },
    { id: 'cinema', label: 'Cine', icon: Layout },
    { id: 'fantasy', label: 'Fantasía', icon: Sparkles },
    { id: 'urban', label: 'Urbano', icon: Camera }
];
