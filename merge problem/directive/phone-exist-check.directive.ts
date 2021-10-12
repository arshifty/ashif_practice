import { Directive, Input } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { CustomerService } from '@app/pages/admin/customer/customer.service';
import { Observable } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';
import { validatePhone } from '../functions/validator';

@Directive({
  selector: '[phoneExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: PhoneExistCheckDirective, multi:
      true
  }]
})
export class PhoneExistCheckDirective implements AsyncValidator {

  @Input() phoneExistCheck: { dial_code: AbstractControl, customer_id: AbstractControl };
  constructor(private _customerService: CustomerService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkPhoneExist(c.value)
      .pipe(
        debounceTime(500),
        first()
      )
  }

  checkPhoneExist(phone_number: string) {
    let customer_id = this.phoneExistCheck.customer_id ? this.phoneExistCheck.customer_id : 'new_customer';
    phone_number = this.phoneExistCheck.dial_code && phone_number ? this.phoneExistCheck.dial_code.toString() == '+353' || this.phoneExistCheck.dial_code.toString() == '353' ? '08' + phone_number : phone_number[0] == '0' ? phone_number : '0' + phone_number : phone_number;
    let phone_code = this.phoneExistCheck.dial_code ? this.phoneExistCheck.dial_code : '+353'

    return new Observable(observer => {
      let response = phone_number && phone_number.length > 2 ? validatePhone(phone_code, phone_number.slice(1, phone_number.length)) : { isValid: false };

      if (response.isValid && customer_id != 'edit_customer') {
        this._customerService.checkExistswithNumber(phone_code, phone_number, customer_id)
          .subscribe((result: any) => {
            if (result && result.is_exist) {
              observer.next({ invalid: true, message: 'Phone number already exist' });
            } else {
              observer.next(null)
            }
          })

      } else {
        observer.next(null)
      }

    })
  }

}
