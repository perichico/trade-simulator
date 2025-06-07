export interface Alerta {
    id?: number;
    usuarioId: number;
    portafolioId: number; // Nuevo campo obligatorio
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
    nombrePortafolio?: string;
    precioActual?: number;
}

// Interfaz para la respuesta del servidor al crear alerta
export interface RespuestaCreacionAlerta {
    alerta: Alerta;
    mensaje: string;
    venta_ejecutada: boolean;
    resultado_venta?: {
        cantidadVendida: number;
        valorTotal: number;
        precioVenta: number;
    };
    precio_ejecucion?: number;
}