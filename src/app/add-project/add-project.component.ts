import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
})
export class AddProjectComponent implements OnInit {
  wranglerEmail = environment.wranglerEmail;
  submitted = false;
  constructor() {}

  ngOnInit(): void {}

  onSubmit(f): void {
    // TODO Implement sending of data here
    console.log(f);
    this.submitted = true;
  }

  reset(): void {
    this.submitted = false;
  }
}
