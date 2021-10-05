import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrizeUpdateCustomerComponent } from './prize-update-customer.component';

describe('PrizeUpdateCustomerComponent', () => {
  let component: PrizeUpdateCustomerComponent;
  let fixture: ComponentFixture<PrizeUpdateCustomerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PrizeUpdateCustomerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrizeUpdateCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
