import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';

const routes: Routes = [
  { path: 'about', component: AboutComponent },
  {
    path: 'error',
    loadChildren: () =>
      import('./errors/errors.module').then((m) => m.ErrorsModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./projects/projects.module').then((m) => m.ProjectsModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
