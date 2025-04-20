import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'trade-simulator-frontend';
  darkMode = false;

  constructor() {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved === 'true';
    this.setDarkModeClass();
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
