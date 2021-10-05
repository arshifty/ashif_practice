import { AbstractControl } from '@angular/forms';

export default function ValidateEmail(control: AbstractControl) {
    if(control.value){
       const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let status = re.test(String(control.value).toLowerCase());
        if(!status){
            return { invalid: true, message: 'Not a valid email'};
        }
    }
    return null;
}