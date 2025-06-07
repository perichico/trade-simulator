import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Portafolio, ActivoEnPortafolio } from '../models/portafolio.model';
import { Transaccion } from '../models/transaccion.model';
import { Activo } from '../models/activo.model';
import { TransaccionService } from './transaccion.service';
import { ActivoService } from './activo.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {

  private apiUrl = `${environment.apiUrl}/portafolio`;
  
  // Mantener el portafolio actualmente seleccionado
  private portafolioActualSubject = new BehaviorSubject<Portafolio | null>(null);
  portafolioActual$ = this.portafolioActualSubject.asObservable();
  
  // Almacena el ID del portafolio actualmente seleccionado
  private portafolioSeleccionadoId: number | null = null;

  constructor(
    private http: HttpClient,
    private transaccionService: TransaccionService,
    private activoService: ActivoService
  ) { }

  // Obtener todos los portafolios del usuario
  obtenerPortafolios(usuarioId: number): Observable<Portafolio[]> {
    return this.http.get<Portafolio[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      map(portafolios => {
        // Asegurarse de que cada portafolio tenga los campos necesarios
        return portafolios.map(portafolio => ({
          ...portafolio,
          valorTotal: portafolio.valorTotal || 0,
          rendimientoTotal: portafolio.rendimientoTotal || 0
        }));
      }),
      catchError(error => {
        console.error('Error al obtener portafolios del usuario', error);
        return of([]);
      })
    );
  }

  // Crear un nuevo portafolio para el usuario
  crearPortafolio(usuarioId: number, nombre: string): Observable<Portafolio> {
    return this.http.post<Portafolio>(`${this.apiUrl}/crear`, {
      usuarioId,
      nombre,
      fechaCreacion: new Date()
      // No enviamos activos ni valorTotal, estos se establecerán en el backend
    }).pipe(
      map(portafolio => ({
        ...portafolio,
        activos: [], // Aseguramos que no haya activos iniciales
        valorTotal: portafolio.valorTotal || 10000, // Usamos el valor del backend o 10000 por defecto
        rendimientoTotal: 0
      })),
      catchError(error => {
        console.error('Error al crear nuevo portafolio', error);
        throw error;
      })
    );
  }

  // Seleccionar un portafolio como activo
  seleccionarPortafolio(portafolioId: number): Observable<Portafolio> {
    this.portafolioSeleccionadoId = portafolioId;
    
    // Llamar al endpoint del backend para seleccionar el portafolio
    return this.http.post<any>(`${this.apiUrl}/seleccionar/${portafolioId}`, {}).pipe(
      switchMap(() => this.obtenerPortafolioPorId(portafolioId)),
      tap(portafolio => {
        this.portafolioActualSubject.next(portafolio);
      }),
      catchError(error => {
        console.error('Error al seleccionar portafolio', error);
        // Si hay un error, intentar obtener el portafolio de todos modos
        return this.obtenerPortafolioPorId(portafolioId);
      })
    );
  }

  // Obtener el portafolio actualmente seleccionado
  obtenerPortafolioActual(): Observable<Portafolio | null> {
    if (this.portafolioSeleccionadoId) {
      return this.obtenerPortafolioPorId(this.portafolioSeleccionadoId);
    }
    return of(null);
  }

  // Obtener un portafolio específico por su ID
  obtenerPortafolioPorId(portafolioId: number): Observable<Portafolio> {
    return this.http.get<any>(`${this.apiUrl}/${portafolioId}`).pipe(
      map(response => {
        console.log('Respuesta del backend para portafolio:', response);
        
        // Verificar si la respuesta tiene activos
        if (!response.activos || !Array.isArray(response.activos)) {
          console.warn('No se encontraron activos en la respuesta o no es un array');
          response.activos = [];
        }
        
        // Transformar la respuesta del backend al formato que espera el frontend
        const activos: ActivoEnPortafolio[] = response.activos
          .filter((activo: any) => {
            // Filtrar activos sin ID - mejorar la detección de IDs
            const id = activo.id || activo.activoId || activo.activo_id;
            if (!activo || !id) {
              console.warn('Activo sin ID detectado en el portafolio:', activo);
              return false;
            }
            return true;
          })
          .map((activo: any) => {
            console.log('Procesando activo:', activo);
            
            // Normalizar los diferentes nombres de propiedades que puede usar el backend
            const id = activo.id || activo.activoId || activo.activo_id || 0;
            const nombre = activo.nombre || activo.name || activo.Activo?.nombre || 'Activo sin nombre';
            const simbolo = activo.simbolo || activo.symbol || activo.ticker || activo.Activo?.simbolo || 'N/A';
            const cantidad = parseFloat(activo.cantidad || activo.quantity || activo.shares || '0');
            const precioCompra = parseFloat(activo.precioCompra || activo.precio_compra || activo.purchase_price || '0');
            const precioActual = parseFloat(activo.precioActual || activo.precio_actual || activo.current_price || activo.ultimo_precio || activo.Activo?.ultimo_precio || '0');
            
            // Validar que tenemos datos válidos para el cálculo
            if (cantidad <= 0 || precioCompra <= 0 || precioActual <= 0) {
              console.warn('Datos insuficientes para calcular rendimiento del activo:', {
                id, cantidad, precioCompra, precioActual
              });
            }
            
            // Calcular valores derivados correctamente
            const valorTotal = cantidad * precioActual;
            const costoBasis = cantidad * precioCompra;
            const rendimiento = valorTotal - costoBasis;
            const rendimientoPorcentaje = precioCompra > 0 ? 
              ((precioActual - precioCompra) / precioCompra) * 100 : 0;
              
            return {
              activoId: id,
              nombre: nombre,
              simbolo: simbolo,
              cantidad: cantidad,
              precioCompra: precioCompra,
              precioActual: precioActual,
              valorTotal: Math.round(valorTotal * 100) / 100,
              rendimiento: Math.round(rendimiento * 100) / 100,
              rendimientoPorcentaje: Math.round(rendimientoPorcentaje * 100) / 100
            };
          });

        // Calcular valores totales del portafolio
        const valorTotal = activos.reduce((total, activo) => total + activo.valorTotal, 0);
        const rendimientoTotal = activos.reduce((total, activo) => total + activo.rendimiento, 0);
        
        const portafolio = {
          id: response.id,
          nombre: response.nombre || 'Portafolio sin nombre',
          usuarioId: response.usuarioId || response.usuario_id || 0,
          activos,
          valorTotal: Math.round(valorTotal * 100) / 100, // Solo valor de activos
          rendimientoTotal: Math.round(rendimientoTotal * 100) / 100,
          fechaCreacion: response.fechaCreacion ? new Date(response.fechaCreacion) : new Date(),
          saldo: response.saldo || response.balance || 0,
        };
        
        console.log('Portafolio procesado con valores:', {
          valorTotal: portafolio.valorTotal,
          rendimientoTotal: portafolio.rendimientoTotal,
          activosCount: activos.length,
          activosConRendimiento: activos.filter(a => a.rendimiento !== 0).length
        });
        
        return portafolio;
      }),
      catchError(error => {
        console.error('Error al obtener portafolio', error);
        return of({
          id: portafolioId,
          nombre: 'Portafolio sin nombre',
          usuarioId: 0,
          activos: [],
          valorTotal: 0,
          rendimientoTotal: 0,
          fechaCreacion: new Date(),
          saldo: 0,
        });
      })
    );
  }

  // Calcular las posiciones por cada activo basado en las transacciones
  private calcularPosicionesPorActivo(transacciones: Transaccion[], activos: Activo[]): ActivoEnPortafolio[] {
    // Agrupar transacciones por activo
    const transaccionesPorActivo = this.agruparTransaccionesPorActivo(transacciones);
    
    // Convertir a array de posiciones
    return Object.keys(transaccionesPorActivo).map(activoIdStr => {
      // Validar que el ID sea un número válido
      if (!activoIdStr || isNaN(parseInt(activoIdStr))) {
        console.warn('ID de activo inválido detectado:', activoIdStr);
        return null;
      }
      
      const activoId = parseInt(activoIdStr);
      const transaccionesActivo = transaccionesPorActivo[activoId];
      
      // Validar que existan transacciones para este activo
      if (!transaccionesActivo || transaccionesActivo.length === 0) {
        console.warn(`No hay transacciones para el activo ID ${activoId}`);
        return null;
      }
      
      // Encontrar el activo correspondiente para obtener precio actual y nombre
      const activo = activos.find(a => a.id === activoId);
      if (!activo) {
        console.warn(`Activo con ID ${activoId} no encontrado en la lista de activos`);
        return null; // No podemos procesar sin información del activo
      }
      
      // Calcular cantidad total (compras - ventas)
      let cantidadTotal = 0;
      let costoTotal = 0;
      
      transaccionesActivo.forEach(t => {
        if (t.tipo === 'compra') {
          cantidadTotal += t.cantidad;
          costoTotal += t.cantidad * t.precio;
        } else {
          cantidadTotal -= t.cantidad;
          costoTotal -= t.cantidad * t.precio;
        }
      });
      
      // Si no hay posición, no incluir en el portafolio
      if (cantidadTotal <= 0) return null;
      
      // Calcular precio promedio de compra
      const precioCompra = costoTotal / cantidadTotal;
      
      // Calcular valor actual y rendimiento
      const precioActual = activo.precio || activo.ultimo_precio || 0;
      const valorTotal = cantidadTotal * precioActual;
      const rendimiento = valorTotal - (cantidadTotal * precioCompra);
      const rendimientoPorcentaje = precioCompra > 0 ? (rendimiento / (cantidadTotal * precioCompra)) * 100 : 0;
      
      return {
        activoId,
        nombre: activo.nombre || 'Activo sin nombre',
        simbolo: activo.simbolo || 'N/A',
        cantidad: cantidadTotal,
        precioCompra,
        precioActual,
        valorTotal,
        rendimiento,
        rendimientoPorcentaje
      };
    }).filter(posicion => posicion !== null) as ActivoEnPortafolio[];
  }

  // Agrupar transacciones por activo
  private agruparTransaccionesPorActivo(transacciones: Transaccion[]): { [activoId: number]: Transaccion[] } {
    return transacciones
      .filter(transaccion => {
        // Validar que la transacción tenga un activoId válido
        if (!transaccion || !transaccion.activoId) {
          console.warn('Transacción sin ID de activo detectada:', transaccion);
          return false;
        }
        return true;
      })
      .reduce((grupos, transaccion) => {
        const { activoId } = transaccion;
        if (!grupos[activoId]) {
          grupos[activoId] = [];
        }
        grupos[activoId].push(transaccion);
        return grupos;
      }, {} as { [activoId: number]: Transaccion[] });
  }

  // Calcular rendimiento total del portafolio
  calcularRendimientoTotal(portafolio: Portafolio): number {
    if (!portafolio || !portafolio.activos || !Array.isArray(portafolio.activos)) {
      console.warn('Portafolio inválido o sin activos al calcular rendimiento total');
      return 0;
    }
    return portafolio.activos.reduce((total, activo) => {
      // Validar que el activo tenga un rendimiento válido
      if (!activo || typeof activo.rendimiento !== 'number') {
        return total;
      }
      
      return total + activo.rendimiento;
    }, 0);
  }

  // Calcular rendimiento porcentual del portafolio
  calcularRendimientoPorcentual(portafolio: Portafolio): number {
    if (!portafolio) {
      console.warn('Portafolio inválido al calcular rendimiento porcentual');
      return 0;
    }
    
    // Saldo inicial de referencia en EUR
    const saldoInicial = 10000;
    
    // Calcular patrimonio total actual (saldo + valor de activos)
    const saldoActual = portafolio.saldo || 0;
    const valorActivos = this.calcularValorTotalActivos(portafolio);
    const patrimonioTotal = saldoActual + valorActivos;
    
    // Calcular rendimiento porcentual basado en el patrimonio total
    const rendimientoPorcentual = ((patrimonioTotal - saldoInicial) / saldoInicial) * 100;
    
    return Math.round(rendimientoPorcentual * 100) / 100;
  }

  // Método auxiliar para calcular el valor total de activos
  private calcularValorTotalActivos(portafolio: Portafolio): number {
    if (!portafolio?.activos || !Array.isArray(portafolio.activos)) {
      return 0;
    }

    return portafolio.activos.reduce((total, activo) => {
      const valor = activo.cantidad * activo.precioActual;
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
  }

  // Eliminar un portafolio y sus activos asociados
  eliminarPortafolio(portafolioId: number): Observable<any> {
    // Primero eliminamos los activos del portafolio y luego el portafolio en sí
    return this.http.delete(`${this.apiUrl}/${portafolioId}/activos`).pipe(
      switchMap(() => this.http.delete(`${this.apiUrl}/${portafolioId}`)),
      tap(() => {
        // Si el portafolio eliminado era el seleccionado, limpiar la selección
        if (this.portafolioSeleccionadoId === portafolioId) {
          this.portafolioSeleccionadoId = null;
          this.portafolioActualSubject.next(null);
        }
      }),
      catchError(error => {
        console.error('Error al eliminar el portafolio o sus activos', error);
        throw error;
      })
    );
  }
}