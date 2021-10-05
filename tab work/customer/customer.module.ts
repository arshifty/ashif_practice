import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { CustomerRoutingModule } from './customer-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared';
import { CustomerComponent } from './customer.component';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { ViewCustomerComponent } from './view-customer/view-customer.component';
import { EditCustomerComponent } from './edit-customer/edit-customer.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UploadSalesComponent } from './upload-sales/upload-sales.component';
import { JackpotUpdateCustomerComponent } from './jackpot-update-customer/jackpot-update-customer.component';
import { PrizeUpdateCustomerComponent } from './prize-update-customer/prize-update-customer.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    CustomerRoutingModule,
    DragDropModule,
    NgxMaterialTimepickerModule.forRoot()
  ],
  declarations: [
    CustomerComponent,
    AddCustomerComponent,
    ViewCustomerComponent,
    EditCustomerComponent,
    UploadSalesComponent,
    JackpotUpdateCustomerComponent,
    PrizeUpdateCustomerComponent,
    
  ],
  entryComponents: [
    ConfirmationDialogComponent,
    UploadSalesComponent,
    JackpotUpdateCustomerComponent,
    PrizeUpdateCustomerComponent,
    
  ]
})
export class CustomerModule {}
