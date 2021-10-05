import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JackpotUpdateCustomerComponent } from './jackpot-update-customer.component';

describe('JackpotUpdateCustomerComponent', () => {
  let component: JackpotUpdateCustomerComponent;
  let fixture: ComponentFixture<JackpotUpdateCustomerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JackpotUpdateCustomerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JackpotUpdateCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
