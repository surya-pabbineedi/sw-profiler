import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SwaggerService } from './swagger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends SwaggerService {
  isAuthenticated$ = new BehaviorSubject<boolean>(true);

  authenticate(username: string, password: string) {}
}
