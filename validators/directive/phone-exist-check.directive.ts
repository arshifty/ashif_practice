import { Directive, Input } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of as observableOf } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, map } from 'rxjs/operators';
import { PhoneValidatorService } from '../services/phone-validator.service';

@Directive({
  selector: '[phoneExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: PhoneExistCheckDirective, multi:
      true
  }]
})

export class PhoneExistCheckDirective implements AsyncValidator {
  @Input() phoneExistCheck: { id: AbstractControl, admin_type: AbstractControl, phone_code: AbstractControl };
  constructor(private emailService: PhoneValidatorService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkPhoneExist(c.value)
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        first()
      )
  }

  checkPhoneExist(phone_number: string) {
    let id = this.phoneExistCheck.id;
    let admin_type = this.phoneExistCheck.admin_type;   
    phone_number = this.phoneExistCheck.phone_code ? this.phoneExistCheck.phone_code.toString() == '+353' || this.phoneExistCheck.phone_code.toString() == '353' ? '08' + phone_number : phone_number[0] == '0'?  phone_number: '0'+ phone_number : phone_number;
    let phone_code = this.phoneExistCheck.phone_code ? this.phoneExistCheck.phone_code : '+353'

    return new Observable(observer => {
      !phone_number ? observer.next(null) :
      phone_number && phone_number.length < 5 ? observer.next(null) :
      this.emailService.checkExistsCustomer(phone_number, phone_code, id, admin_type)
          .subscribe((result: any) => {
            if (result && result.is_exist) {
              observer.next({ invalid: true, message: 'Phone number already exist' });
            } else {
              observer.next(null)
            }
          }) 
    })
  }
}