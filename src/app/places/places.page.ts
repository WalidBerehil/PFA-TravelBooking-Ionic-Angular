import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-places',
  templateUrl: './places.page.html',
  styleUrls: ['./places.page.scss'],
})
export class PlacesPage implements OnInit {
  isAdmin =false;
  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.isAdminOrNot();
          
  }
	isAdminOrNot() {
		this.authService.userId.pipe(take(1)).subscribe(userId => {
			if (userId == 'Zz7ubaozsEcsOYtWJeqrmQiWYHu1') {
				this.isAdmin = true;
			} else {
				this.isAdmin = false;
			}
		});
	}
}
