import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  cargando = false;
  ocultarPassword = true;
  ocultarConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }

    // Inicializar formulario
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.checkPasswords });
  }

  // Validador personalizado para comprobar que las contraseñas coinciden
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { notSame: true };
  }

  onSubmit(): void {
    if (this.registroForm.valid) {
      this.cargando = true;
      const { nombre, email, password } = this.registroForm.value;

      this.authService.registro(nombre, email, password).subscribe({
        next: () => {
          this.cargando = false;
          this.snackBar.open(
            'Registro completado con éxito. ¡Bienvenido!',
            'Cerrar',
            { duration: 3000 }
          );
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.cargando = false;
          this.snackBar.open(
            `Error al registrarse: ${error.error?.error || 'Error desconocido'}`,
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
  }
}