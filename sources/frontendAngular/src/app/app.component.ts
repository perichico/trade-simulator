import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'trade-simulator-frontend';
  darkMode = false;
  esAdministrador$: Observable<boolean>;

  constructor(private authService: AuthService) {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved === 'true';
    this.setDarkModeClass();
    
    // Suscribirse al observable de administrador
    this.esAdministrador$ = this.authService.esAdministrador$;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    this.setDarkModeClass();
  }

  setDarkModeClass() {
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
