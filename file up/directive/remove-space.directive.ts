import { Directive, HostListener, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Directive({
  selector: 'input[removeSpace],textarea[removeSpace]'
})
export class RemoveSpaceDirective implements OnInit, OnDestroy {

  private _valueAccessor: ControlValueAccessor;
  private _writeValue: (value) => void;

  constructor(
    @Optional() private ngControl: NgControl
  ) { }

  ngOnInit(): void {

    if (!this.ngControl) {
      console.warn('Note: The trim directive should be used with one of ngModel, formControl or formControlName directives.');
      return;
    }

    this._valueAccessor = this.ngControl.valueAccessor;

    this._writeValue = this._valueAccessor.writeValue;
    this._valueAccessor.writeValue = (value) => {

      const _value = !value || 'function' !== typeof value.trim ? value : value.trim();

      if (this._writeValue) {
        this._writeValue.call(this._valueAccessor, _value);
      }

      if (value !== _value) {
        if (this._valueAccessor['onChange']) {
          this._valueAccessor['onChange'](_value);
        }

        if (this._valueAccessor['onTouched']) {
          this._valueAccessor['onTouched']();
        }
      }
    };
  }

  private static dispatchEvent(el, eventType) {
    const event = document.createEvent('Event');
    event.initEvent(eventType, false, false);
    el.dispatchEvent(event);
  }

  private static trimValue(el, value) {
    el.value = value.trim();
    RemoveSpaceDirective.dispatchEvent(el, 'input');
  }

  @HostListener('blur', [
    '$event.target',
    '$event.target.value',
  ])
  onBlur(el: any, value: string): void {
   
    if ('function' === typeof value.trim && value.trim() !== value) {
      RemoveSpaceDirective.trimValue(el, el.value);
    }
  }

  ngOnDestroy(): void {
   
    if (this._valueAccessor && this._writeValue) {
      this._valueAccessor.writeValue = this._writeValue;
    }
  }

}

