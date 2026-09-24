import { Component, isDevMode, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CreateTranscationComponent } from './components/create-transcation/create-transcation.component';
import { HeaderComponent } from './components/header/header.component';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
    imports:[HeaderComponent,RouterOutlet]
})
export class AppComponent implements OnInit {
  ngOnInit() {
    if (isDevMode()) {
      console.log('Development!');
    } else {
      console.log('Production!');
    }
  }
  title = 'Demo Apps';

  constructor(private _router: Router){
    this._router.navigate(['home'])
  }
}

