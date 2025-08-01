import { Directive, ElementRef, Input } from '@angular/core';

@Directive({ selector: '[formzFieldLabel]' })
export class FieldLabelDirective {
  /** Whether the label should float above the field. */
  @Input() isFloating = false;

  constructor(public elementRef: ElementRef) {}
}
