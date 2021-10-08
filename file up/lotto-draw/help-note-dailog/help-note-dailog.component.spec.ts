import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpNoteDailogComponent } from './help-note-dailog.component';

describe('HelpNoteDailogComponent', () => {
  let component: HelpNoteDailogComponent;
  let fixture: ComponentFixture<HelpNoteDailogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelpNoteDailogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpNoteDailogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
