import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Registro de Usuario</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="registroForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" required>
            <mat-error *ngIf="registroForm.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required>
            <mat-error *ngIf="registroForm.get('email')?.hasError('required')">El email es requerido</mat-error>
            <mat-error *ngIf="registroForm.get('email')?.hasError('email')">Email inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" required>
            <mat-error *ngIf="registroForm.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
            <mat-error *ngIf="registroForm.get('password')?.hasError('minlength')">La contraseña debe tener al menos 6 caracteres</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="registroForm.invalid">Registrarse</button>
        </form>
      </mat-card-content>
      <mat-card-actions>
        <a mat-button routerLink="/login">¿Ya tienes cuenta? Inicia sesión</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      margin: 100px 0;
    }
    mat-card {
      max-width: 400px;
      width: 100%;
      margin: 0 20px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    mat-card-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class RegistroComponent {
  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.http.post('http://localhost:3000/registro', this.registroForm.value)
        .subscribe({
          next: (response: any) => {
            this.snackBar.open('Registro exitoso', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/login']);
          },
          error: (error) => {
            this.snackBar.open('Error en el registro', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
}