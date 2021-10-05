import { Directive, Input } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, first } from 'rxjs/operators';
import { EmailValidatorService } from '../services/email-validator.service';

@Directive({
  selector: '[emailExistCheck]',
  providers: [{
    provide: NG_ASYNC_VALIDATORS, useExisting: EmailExistCheckDirective, multi:
      true
  }]
})
export class EmailExistCheckDirective implements AsyncValidator {
  @Input() emailExistCheck: { id: AbstractControl, admin_type: AbstractControl };


  constructor(private emailService: EmailValidatorService) { }

  validate(c: AbstractControl): Observable<ValidationErrors | null> {
    return this.checkEmailExist(c.value)
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        first()
      )
  }

  checkEmailExist(email: string) {
    let id = this.emailExistCheck.id;
    let admin_type = this.emailExistCheck.admin_type;

    return new Observable(observer => {
      !email ? observer.next(null) :
        this.emailService.checkExistEmail(id, admin_type, email)
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
