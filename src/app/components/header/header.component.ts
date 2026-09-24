import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent implements OnInit {

  constructor(private router: Router) {

  }

  ngOnInit() {
  }

  goHome() {
    this.router.navigate(['/']);
  }


}
