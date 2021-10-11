import { Directive, Input } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of as observableOf } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, map } from 'rxjs/operators';
import { ValidatorsService } from '../services/validators.service';


@Directive({
  selector: '[phoneExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: PhoneExistCheckDirective, multi:
      true
  }]
})

export class PhoneExistCheckDirective implements AsyncValidator {
 @Input() phoneExistCheck: { dial_code: AbstractControl };
  constructor(private validatorsService: ValidatorsService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkPhoneExist(c.value)
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        first()
      )
  }

  checkPhoneExist(phone_number: string) {
    phone_number = this.phoneExistCheck.dial_code ? this.phoneExistCheck.dial_code.toString() == '+353' || this.phoneExistCheck.dial_code.toString() == '353' ? '08' + phone_number : phone_number[0] == '0'?  phone_number: '0'+ phone_number : phone_number;
    let phone_code = this.phoneExistCheck.dial_code ? this.phoneExistCheck.dial_code : '+353'
  
    return new Observable(observer => {
      !phone_number ? observer.next(null) :
        phone_number && phone_number.length < 5 ? observer.next(null) :
          this.validatorsService.checkExistingSupporter('phone','',phone_code, phone_number)
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
