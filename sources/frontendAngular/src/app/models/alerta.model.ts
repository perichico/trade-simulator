export interface Alerta {
    id?: number;
    usuarioId: number;
    activoId: number;
    precioObjetivo: number;
    cantidadVenta: number; // Ahora es obligatorio (sin ?)
    condicion?: 'mayor' | 'menor';
    estado?: 'activa' | 'disparada' | 'cancelada';
    activa: boolean;
    fechaCreacion?: Date;
    fechaDisparo?: Date;
    // Propiedades adicionales para la UI
    simboloActivo?: string;
    nombreActivo?: string;
    precioActual?: number;
}