import { Directive, Input } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, first } from 'rxjs/operators';
import { ValidatorsService } from '../services/validators.service';

@Directive({
  selector: '[emailExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: EmailExistCheckDirective, multi:
      true
  }]
})
export class EmailExistCheckDirective implements AsyncValidator {
  
  constructor(private validatorsService: ValidatorsService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkEmailExist(c.value)
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        first()
      )
  }

  checkEmailExist(email: string) {
    return new Observable(observer => {
      !email  ? observer.next(null) :
        this.validatorsService.checkExistingSupporter('email',email,'','')
          .subscribe((result: any) => {
            if (result && result.is_exist) {
              observer.next({ invalid: true, message: 'Email already exist' });
            } else {
              observer.next(null)
            }
          })
    })
  }
}
