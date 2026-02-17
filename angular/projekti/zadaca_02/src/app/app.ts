import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KONFIGURACIJA } from './sucelja/konfiguracija';
import { Navigacija } from './komponente/navigacija/navigacija';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigacija],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Zadaća 2');
}
