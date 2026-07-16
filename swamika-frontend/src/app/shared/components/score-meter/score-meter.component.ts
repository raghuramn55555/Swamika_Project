import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MeterType = 'match' | 'conf' | 'parse';

/**
 * Reusable score meter segment.
 * Replaces the repeated .score-seg + .meter HTML block used 5× in shell.component.html
 *
 * Usage:
 *   <sw-score-meter label="Match" [value]="89" type="match" />
 *   <sw-score-meter label="Confidence" [value]="82" type="conf" />
 *   <sw-score-meter label="Parsing quality" [value]="95" type="parse" displayText="High" />
 */
@Component({
  selector: 'sw-score-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-seg">
      <div class="top">
        <span>{{ label }}</span>
        <span class="val">{{ displayText ?? value + '%' }}</span>
      </div>
      <div class="meter" [class]="type">
        <div [style.width.%]="value"></div>
      </div>
    </div>
  `,
})
export class ScoreMeterComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input() type: MeterType = 'match';
  /** Override the displayed text (e.g. "High" instead of "95%") */
  @Input() displayText?: string;
}
