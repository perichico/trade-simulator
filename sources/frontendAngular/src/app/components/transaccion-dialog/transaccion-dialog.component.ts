import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Activo } from '../../models/activo.model';

// Interfaz para los datos que recibe el diálogo
interface TransaccionDialogData {
  activo: Activo;
  tipo: 'compra' | 'venta';
  balanceUsuario: number;
}

@Component({
  selector: 'app-transaccion-dialog',
  templateUrl: './transaccion-dialog.component.html',
  styleUrls: ['./transaccion-dialog.component.css']
})
export class TransaccionDialogComponent implements OnInit {
  transaccionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TransaccionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransaccionDialogData
  ) {}

  ngOnInit(): void {
    this.transaccionForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });

    // Suscribirse a cambios en la cantidad para validar fondos suficientes
    this.transaccionForm.get('cantidad')?.valueChanges.subscribe(cantidad => {
      if (this.data.tipo === 'compra') {
        const valorTotal = cantidad * (this.data.activo.precio || 0);
        if (valorTotal > this.data.balanceUsuario) {
          this.transaccionForm.get('cantidad')?.setErrors({ fondosInsuficientes: true });
        }
      }
    });
  }

  // Calcular el valor total de la transacción
  calcularValorTotal(): number {
    const cantidad = this.transaccionForm.get('cantidad')?.value || 0;
    return cantidad * (this.data.activo.precio || 0);
  }

  // Calcular el balance restante después de la compra
  calcularBalanceRestante(): number {
    if (this.data.tipo === 'compra') {
      return this.data.balanceUsuario - this.calcularValorTotal();
    }
    return this.data.balanceUsuario;
  }

  // Confirmar la transacción y cerrar el diálogo
  confirmarTransaccion(): void {
    if (this.transaccionForm.valid) {
      this.dialogRef.close({
        cantidad: this.transaccionForm.get('cantidad')?.value
      });
    }
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number | undefined): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);
  }
}