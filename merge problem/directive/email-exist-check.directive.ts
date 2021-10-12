import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { CustomerService } from '@app/pages/admin/customer/customer.service';
import { Observable } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';
import { validateEmail } from '../functions/validator';

@Directive({
  selector: '[emailExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: EmailExistCheckDirective, multi:
      true
  }]
})
export class EmailExistCheckDirective {

  @Input() emailExistCheck: { customer_id: AbstractControl };

  constructor(private _customerService: CustomerService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkEmailExist(c.value)
      .pipe(
        debounceTime(500),
        first()
      )
  }

  checkEmailExist(email: string) {
    let customer_id = this.emailExistCheck.customer_id ? this.emailExistCheck.customer_id : 'new_customer';
    let isValid = validateEmail(email);

    return new Observable(observer => {

      if (isValid && customer_id != 'edit_customer') {
        this._customerService.checkExistEmail(email, customer_id)
          .subscribe((result: any) => {
            if (result && result.is_exist) {
              observer.next({ invalid: true, message: 'Email already exist' });
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
