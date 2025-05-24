import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { Activo } from '../models/activo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivoService {
  private apiUrl = environment.apiUrl; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los activos disponibles con opción de filtrado por tipo
  obtenerActivos(tipoActivoId?: number): Observable<Activo[]> {
    const params = tipoActivoId ? { params: new HttpParams().set('tipo_activo_id', tipoActivoId.toString()) } : {};
    return this.http.get<Activo[]>(`${this.apiUrl}/activos`, params)
      .pipe(
        map(activos => {
          return activos.map(activo => {
            return {
              ...activo,
              precio: activo.ultimo_precio,
              variacion: activo.variacion ?? 0,
              tendencia: this.determinarTendencia(activo.variacion ?? 0),
              tipo: (activo.tipoActivo?.nombre.toLowerCase() as 'accion' | 'criptomoneda' | 'materia_prima' | 'divisa') || 'accion'
            };
          });
        }),
        catchError(error => {
          console.error('Error al obtener activos', error);
          return of([]); // Devolver array vacío en caso de error
        })
      );
  }

  // Obtener un activo por su ID
  obtenerActivoPorId(id: number): Observable<Activo> {
    console.log('Obteniendo activo por ID:', id);
    
    if (environment.useTestData) {
      console.log('Usando datos de prueba para activo específico');
      let activo = this.getMockActivos().find(a => a.id === id);
      
      // Si no se encuentra el activo en los datos de prueba, crear uno genérico
      if (!activo) {
        console.log(`Activo ${id} no encontrado en datos de prueba, creando uno genérico`);
        activo = this.crearActivoGenerico(id);
      }
      
      return of(activo).pipe(delay(300));
    }

    return this.http.get<Activo>(`${this.apiUrl}/activos/${id}`)
      .pipe(
        map(activo => {
          console.log('Activo recibido del servidor:', activo);
          return {
            ...activo,
            precio: activo.ultimo_precio,
            variacion: activo.variacion ?? 0,
            tendencia: this.determinarTendencia(activo.variacion ?? 0),
            ultima_actualizacion: activo.ultima_actualizacion ? new Date(activo.ultima_actualizacion) : new Date(),
            tipoActivo: activo.tipoActivo || { id: 1, nombre: 'Acción' }
          };
        }),
        catchError((error) => {
          console.error('Error en API real de activo específico:', error);
          console.log('Usando datos de prueba como fallback');
          
          // Buscar en datos de prueba como fallback
          let activo = this.getMockActivos().find(a => a.id === id);
          
          // Si no existe en datos de prueba, crear uno genérico
          if (!activo) {
            activo = this.crearActivoGenerico(id);
          }
          
          return of(activo);
        })
      );
  }

  // Método auxiliar para determinar la tendencia basada en la variación
  private determinarTendencia(variacion: number): 'alza' | 'baja' | 'estable' {
    if (variacion > 0.5) return 'alza';
    if (variacion < -0.5) return 'baja';
    return 'estable';
  }

  // Método para manejar errores
  private handleError(error: any): void {
    console.error('Error en el servicio de activos:', error);
  }

  // Método para crear un activo genérico cuando no se encuentra
  private crearActivoGenerico(id: number): Activo {
    const tiposActivos = [
      { id: 1, nombre: 'Acción', tipo: 'accion' as const },
      { id: 2, nombre: 'Criptomoneda', tipo: 'criptomoneda' as const },
      { id: 3, nombre: 'Materia Prima', tipo: 'materia_prima' as const },
      { id: 4, nombre: 'Divisa', tipo: 'divisa' as const }
    ];
    
    // Seleccionar tipo basado en el ID
    const tipoIndex = id % tiposActivos.length;
    const tipoSeleccionado = tiposActivos[tipoIndex];
    
    const nombres = {
      accion: ['Tesla Inc.', 'Amazon Inc.', 'Netflix Inc.', 'Meta Platforms'],
      criptomoneda: ['Ethereum', 'Cardano', 'Solana', 'Polkadot'],
      materia_prima: ['Plata', 'Petróleo', 'Gas Natural', 'Cobre'],
      divisa: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD']
    };
    
    const simbolos = {
      accion: ['TSLA', 'AMZN', 'NFLX', 'META'],
      criptomoneda: ['ETH', 'ADA', 'SOL', 'DOT'],
      materia_prima: ['SILVER', 'OIL', 'GAS', 'COPPER'],
      divisa: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']
    };
    
    const precios = {
      accion: { min: 50, max: 1000 },
      criptomoneda: { min: 0.1, max: 5000 },
      materia_prima: { min: 10, max: 200 },
      divisa: { min: 0.5, max: 2 }
    };
    
    const nombreIndex = (id - 1) % nombres[tipoSeleccionado.tipo].length;
    const precioRange = precios[tipoSeleccionado.tipo];
    const precio = precioRange.min + Math.random() * (precioRange.max - precioRange.min);
    
    return {
      id: id,
      nombre: nombres[tipoSeleccionado.tipo][nombreIndex],
      simbolo: simbolos[tipoSeleccionado.tipo][nombreIndex],
      ultimo_precio: Number(precio.toFixed(2)),
      ultima_actualizacion: new Date(),
      tipo: tipoSeleccionado.tipo,
      tipoActivo: { id: tipoSeleccionado.id, nombre: tipoSeleccionado.nombre },
      variacion: (Math.random() - 0.5) * 10 // Variación entre -5% y 5%
    };
  }

  // Expandir datos de prueba para incluir más activos
  private getMockActivos(): Activo[] {
    return [
      // Acciones
      { 
        id: 1, 
        nombre: 'Apple Inc.', 
        simbolo: 'AAPL', 
        tipoActivo: { id: 1, nombre: 'Acción' },
        ultimo_precio: 837.18, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'accion',
        variacion: 2.45
      },
      { 
        id: 2, 
        nombre: 'Microsoft Corporation', 
        simbolo: 'MSFT', 
        tipoActivo: { id: 1, nombre: 'Acción' },
        ultimo_precio: 261.87, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'accion',
        variacion: -1.23
      },
      { 
        id: 5, 
        nombre: 'Alphabet Inc.', 
        simbolo: 'GOOGL', 
        tipoActivo: { id: 1, nombre: 'Acción' },
        ultimo_precio: 220.83, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'accion',
        variacion: 0.87
      },
      { 
        id: 9, 
        nombre: 'Intel Corporation', 
        simbolo: 'INTC', 
        tipoActivo: { id: 1, nombre: 'Acción' },
        ultimo_precio: 638.08, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'accion',
        variacion: -3.12
      },
      // Criptomonedas
      { 
        id: 49, 
        nombre: 'Bitcoin', 
        simbolo: 'BTC', 
        tipoActivo: { id: 2, nombre: 'Criptomoneda' },
        ultimo_precio: 45000, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'criptomoneda',
        variacion: 5.67
      },
      { 
        id: 50, 
        nombre: 'Ethereum', 
        simbolo: 'ETH', 
        tipoActivo: { id: 2, nombre: 'Criptomoneda' },
        ultimo_precio: 3200, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'criptomoneda',
        variacion: 3.21
      },
      { 
        id: 51, 
        nombre: 'Cardano', 
        simbolo: 'ADA', 
        tipoActivo: { id: 2, nombre: 'Criptomoneda' },
        ultimo_precio: 0.85, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'criptomoneda',
        variacion: -2.15
      },
      // Materias Primas
      { 
        id: 60, 
        nombre: 'Oro', 
        simbolo: 'GOLD', 
        tipoActivo: { id: 3, nombre: 'Materia Prima' },
        ultimo_precio: 1950, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'materia_prima',
        variacion: 1.15
      },
      { 
        id: 61, 
        nombre: 'Plata', 
        simbolo: 'SILVER', 
        tipoActivo: { id: 3, nombre: 'Materia Prima' },
        ultimo_precio: 24.50, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'materia_prima',
        variacion: 2.30
      },
      { 
        id: 62, 
        nombre: 'Petróleo', 
        simbolo: 'OIL', 
        tipoActivo: { id: 3, nombre: 'Materia Prima' },
        ultimo_precio: 78.90, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'materia_prima',
        variacion: -1.80
      },
      // Divisas
      { 
        id: 70, 
        nombre: 'Euro/Dólar', 
        simbolo: 'EURUSD', 
        tipoActivo: { id: 4, nombre: 'Divisa' },
        ultimo_precio: 1.0985, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'divisa',
        variacion: 0.45
      },
      { 
        id: 71, 
        nombre: 'Libra/Dólar', 
        simbolo: 'GBPUSD', 
        tipoActivo: { id: 4, nombre: 'Divisa' },
        ultimo_precio: 1.2650, 
        ultima_actualizacion: new Date('2025-05-13'),
        tipo: 'divisa',
        variacion: -0.32
      }
    ];
  }
}