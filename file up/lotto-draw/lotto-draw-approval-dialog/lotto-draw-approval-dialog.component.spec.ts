import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LottoDrawApprovalDialogComponent } from './lotto-draw-approval-dialog.component';

describe('LottoDrawApprovlDialogComponent', () => {
  let component: LottoDrawApprovalDialogComponent;
  let fixture: ComponentFixture<LottoDrawApprovalDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LottoDrawApprovalDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LottoDrawApprovalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
