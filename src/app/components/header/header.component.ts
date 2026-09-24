import {Component, inject, OnInit} from '@angular/core';
import {UpperCasePipe} from '@angular/common';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageService} from '../../services/language.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [TranslatePipe, UpperCasePipe],
  standalone: true
})
export class HeaderComponent implements OnInit {

  languageService = inject(LanguageService);

  constructor(private router: Router) {

  }

  ngOnInit() {
  }

  goHome() {
    this.router.navigate(['/']);
  }

  changeLanguage(code: string) {
    this.languageService.use(code).subscribe();
  }


}
