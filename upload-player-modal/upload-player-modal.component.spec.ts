import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPlayerModalComponent } from './upload-player-modal.component';

describe('UploadPlayerModalComponent', () => {
  let component: UploadPlayerModalComponent;
  let fixture: ComponentFixture<UploadPlayerModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadPlayerModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadPlayerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
