import { Component, inject } from '@angular/core';
import { UserService } from '../common/services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isAuthenticated$ = inject(UserService).isAuthenticated$;
}
