// src/app/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// Interface para a estrutura de configuração que virá do backend
interface BackendConfig {
  API_CONTROL_PREFIX: string;
  ENDPOINTS: any;  
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configUrl = 'http://localhost:3000/api/config';  
  private _config = new BehaviorSubject<BackendConfig | null>(null);
  public readonly config$ = this._config.asObservable();

  constructor(private http: HttpClient) { }

  loadConfig(): Observable<BackendConfig | null> {
    if (this._config.getValue()) {
      return of(this._config.getValue());  
    }

    return this.http.get<BackendConfig>(this.configUrl).pipe(
      tap(config => {
        this._config.next(config); 
        console.log('Configuração da API carregada:', config);
      }),
      catchError(error => {
        console.error('Erro ao carregar a configuração da API:', error);
        this._config.next(null);  
        return of(null);  
      })
    );
  }

  // Método para obter a configuração sincronamente (se já carregada)
  get config(): BackendConfig | null {
    return this._config.getValue();
  }
}