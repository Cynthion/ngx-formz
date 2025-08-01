import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { scrollHighlightedOptionIntoView } from '../../../helpers/position.helpers';
import {
  EMPTY_FIELD_OPTION,
  FieldDecoratorLayout,
  FORMZ_FIELD,
  FORMZ_FIELD_OPTION,
  FORMZ_OPTION_FIELD,
  IFormzFieldOption,
  IFormzRadioGroupField
} from '../../../models/formz.model';
import { FieldOptionComponent } from '../../field-option/field-option.component';
import { BaseFieldDirective } from '../base-field.component';

@Component({
  selector: 'formz-radio-group-field',
  templateUrl: './radio-group-field.component.html',
  styleUrls: ['./radio-group-field.component.scss'],
  providers: [
    // required for ControlValueAccessor to work with Angular forms
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupFieldComponent),
      multi: true
    },
    // required to provide this component as IFormzField
    {
      provide: FORMZ_FIELD,
      useExisting: RadioGroupFieldComponent
    },
    // required to provide this component as IFormzOptionField
    {
      provide: FORMZ_OPTION_FIELD,
      useExisting: RadioGroupFieldComponent
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioGroupFieldComponent
  extends BaseFieldDirective
  implements IFormzRadioGroupField, OnInit, AfterContentInit, OnDestroy
{
  @ViewChild('radioGroupRef', { static: true }) radioGroupRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('optionRef') optionRefs?: QueryList<FieldOptionComponent>;

  protected keyboardCallback = (event: KeyboardEvent) => this.handleKeydown(event);
  protected externalClickCallback = null;
  protected windowResizeScrollCallback = null;
  protected registeredKeys = ['ArrowDown', 'ArrowUp', 'Enter'];

  protected highlightedIndex = -1;

  private _value = '';

  private readonly cdRef: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngAfterContentInit(): void {
    this.updateOptions();
  }

  protected doOnValueChange(): void {
    // No additional actions needed
  }

  protected doOnFocusChange(_isFocused: boolean): void {
    // No additional actions needed
  }

  private handleKeydown(event: KeyboardEvent): void {
    const options = this.options$.value;
    const count = options.length;

    switch (event.key) {
      case 'ArrowDown':
        if (count > 0) {
          this.setHighlightedIndex((this.highlightedIndex + 1) % count);
        }
        break;
      case 'ArrowUp':
        if (count > 0) {
          this.setHighlightedIndex((this.highlightedIndex - 1 + count) % count);
        }
        break;
      case 'Enter':
        if (options[this.highlightedIndex]) {
          const option = options[this.highlightedIndex]!;
          this.selectOption(option);
        }
        break;
    }
  }

  //#region ControlValueAccessor

  protected doWriteValue(value: string): void {
    // TODO use this.selectedOption to set the value?
    this._value = value;
    const found = this.options$.value.find((opt) => opt.value === value);

    this.selectedOption = found ? { ...found } : undefined;
  }

  //#endregion

  //#region IFormzRadioGroupField

  @Input() name = '';
  @Input() required = false;

  //#endregion

  //#region IFormzField

  get value(): string | null {
    return this.selectedOption?.value || null;
  }

  readonly isLabelFloating = false;

  get fieldRef(): ElementRef<HTMLElement> {
    return this.radioGroupRef as ElementRef<HTMLElement>;
  }

  decoratorLayout: FieldDecoratorLayout = 'group';

  //#endregion

  //#region IFormzOptionField

  @Input() options?: IFormzFieldOption[] = [];
  @Input() emptyOption: IFormzFieldOption = EMPTY_FIELD_OPTION;
  @Input() sortFn?: (a: IFormzFieldOption, b: IFormzFieldOption) => number;

  @ContentChildren(FORMZ_FIELD_OPTION)
  optionComponents?: QueryList<IFormzFieldOption>;

  protected readonly options$ = new BehaviorSubject<IFormzFieldOption[]>([]);

  private selectedOption?: IFormzFieldOption = undefined;

  public selectOption(option: IFormzFieldOption): void {
    if (option.disabled) return;

    const newOption: IFormzFieldOption = {
      value: option.value,
      label: option.label || option.value, // value as fallback for optional label
      disabled: option.disabled
    };

    this.selectedOption = newOption;

    this.valueChangeSubject$.next(this.selectedOption.value);
    this.valueChanged.emit(this.selectedOption.value);
    this.onChange(this.selectedOption.value); // notify ControlValueAccessor of the change
    this.onTouched();

    this.highlightSelectedOption();
  }

  private updateOptions(): void {
    // The projected options (option.template) might not be available immediately after content initialization,
    // so we use setTimeout to ensure they are processed after the current change detection cycle.
    setTimeout(() => {
      const inlineOptions = this.options ?? [];
      const projectedOptions = this.optionComponents?.toArray() ?? [];

      let combined = [...inlineOptions, ...projectedOptions];

      if (this.sortFn) {
        combined = combined.sort(this.sortFn);
      }

      this.options$.next(combined);

      this.writeValue(this._value);
    });
  }

  //#endregion

  private highlightSelectedOption(): void {
    const selectedIndex = this.options$.value.findIndex((opt) => opt.value === this.selectedOption?.value);

    this.setHighlightedIndex(selectedIndex);
  }

  private setHighlightedIndex(index: number): void {
    this.highlightedIndex = index;

    this.cdRef.markForCheck(); // TODO required?

    setTimeout(() => scrollHighlightedOptionIntoView(index, this.optionRefs));
  }
}
