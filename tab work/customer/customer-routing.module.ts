import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomerComponent } from './customer.component';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { ViewCustomerComponent } from './view-customer/view-customer.component';
import { AuthGuardService } from '../../../core';
import { EditCustomerComponent } from './edit-customer/edit-customer.component';

const routes: Routes = [
  {
    path: '',
    component: CustomerComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'add',
    component: AddCustomerComponent
  },
  {
    path: 'edit/:id',
    component: EditCustomerComponent
  },
  {
    path: 'view/:id',
    component: ViewCustomerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule {}
