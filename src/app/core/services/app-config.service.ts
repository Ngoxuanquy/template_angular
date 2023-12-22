import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InitializeAppService {
  apiUrl: string = '';

  constructor(private http: HttpClient) {}

  public initializeApp(): Observable<any> {
    return this.http.get('./assets/config.json').pipe(
      tap((data: any) => {
        console.log({ data });
        this.apiUrl = data.ApiUrl; // Assuming the API URL is a property in your config.json
      }),
      catchError((error) => {
        console.error('Error loading app configuration', error);
        throw error; // Rethrow the error to let the app fail gracefully
      })
    );
  }

  public getApiUrl(): string {
    console.log(this.apiUrl);
    return this.apiUrl;
  }
}
