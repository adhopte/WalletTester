import { Component, inject } from '@angular/core';
import { ConfigService } from '../../services/config-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [TranslatePipe],
  standalone: true
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly version = inject(ConfigService).appVersion();
}
