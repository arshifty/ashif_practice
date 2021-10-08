import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LottoDrawPerformeDialogComponent } from './lotto-draw-performe-dialog.component';

describe('LottoDrawPerformeDialogComponent', () => {
  let component: LottoDrawPerformeDialogComponent;
  let fixture: ComponentFixture<LottoDrawPerformeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LottoDrawPerformeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LottoDrawPerformeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
