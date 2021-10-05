import { AbstractControl } from '@angular/forms';

export default function ValidatePhoneNumber(control: AbstractControl) {
    let phone_code_primary = control.get('phone_code_primary').value;
    let phone_code_bill = control.get('phone_code_bill').value;
    let phone_primary = control.get('phone_primary').value;
    let phone_bill = control.get('phone_bill').value;
    let phone_code, phone;
    let response = { phone_primary: false, phone_primary_message: "", phone_bill: false, phone_bill_message: "" };

    if (phone_primary && phone_primary.toString().length) {
        phone_code = phone_code_primary;
        phone = phone_primary.toString();
        let res = checkPhoneNumber(phone, phone_code);
        if (!res.success) {
            response.phone_primary = true;
            response.phone_primary_message = res.message;
        }
    }
    if (phone_bill && phone_bill.toString().length) {
        phone_code = phone_code_bill;
        phone = phone_bill.toString();
        let res = checkPhoneNumber(phone, phone_code);
        if (!res.success) {
            response.phone_bill = true;
            response.phone_bill_message = res.message;
        }
    }

    if (response.phone_primary || response.phone_bill) {
        return response;
    }

    return null;
}

function checkPhoneNumber(phone, phone_code) {
    if (isNaN(phone)) {
        return { success: false, message: 'Phone must be numeric' }
    }
    else if (typeof phone_code == 'undefined' && phone.length > 1) {
        return { success: false, message: 'Dial Code is required' }
    }
    else if (phone_code == '+353' || phone_code == '353') {     
        if ( phone.length > 0 && phone.length != 8) {
            return { success: false, message: 'Phone must be 10 digits, ex:08x1234567' }
        }       
    }
    else if (phone.length < 5) {
        return { success: false, message: 'Phone is not valid' };
    }

    return { success: true }

}