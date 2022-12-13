import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { InputTypes, TipStatus } from '@swimlane/ngx-ui';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  InputTypes = InputTypes;
  TipStatus = TipStatus;

  username = '';
  password = '';
  isLocked = false;
  remainingLogInAttempts = 0;
  submitDisabled = false;

  constructor(private readonly router: Router, private readonly userService: UserService) {}

  login() {
    this.submitDisabled = true;
    this.isLocked = true;

    this.userService.isAuthenticated$.next(true);

    this.router.navigate(['/import']);
  }
}
