import type { Reading } from "./types";
import { findByDateRange } from "./readings";

const PLAN_START = new Date(2026, 2, 28); // 28 March 2026
const PLAN_END = new Date(2027, 2, 27); // 27 March 2027

const pad = (n: number) => String(n).padStart(2, "0");

function toInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseInputDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const AUDIO_ICON = `<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M11 5L6 9H2v6h4l5 4V5zM15.536 8.464a5 5 0 010 7.072M19.07 4.929a10 10 0 010 14.142"/>
</svg>`;

function renderResults(container: HTMLElement, readings: Reading[]): void {
  if (readings.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-400 text-center py-4">No readings found for the selected range.</p>`;
    return;
  }

  const count = readings.length;
  container.innerHTML =
    `<p class="text-xs text-gray-400 mb-3">${count} day${count === 1 ? "" : "s"} of readings</p>` +
    readings
      .map(
        (r) => `
    <div class="reading-row space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-methodist-red">Day ${r.day} — ${r.date.trim()}</span>
        <span class="text-xs text-gray-400">${r.dayOfWeek}</span>
      </div>
      <div>
        <div class="reading-label">Old Testament</div>
        <div class="reading-passage">${r.ot}</div>
      </div>
      <div>
        <div class="reading-label">Psalm / Proverb</div>
        <div class="reading-passage">${r.psalmProverb}</div>
      </div>
      <div>
        <div class="reading-label">New Testament</div>
        <div class="reading-passage">${r.nt}</div>
      </div>
      ${
        r.audioRef
          ? `<div class="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
          ${AUDIO_ICON}
          Audio ref: <strong>${r.audioRef}</strong>
        </div>`
          : ""
      }
    </div>`,
      )
      .join("");
}

const INPUT_CLASS =
  "text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-methodist-red";

export function renderCatchUp(
  section: HTMLElement,
  allReadings: Reading[],
): void {
  const today = new Date();
  const clampedToday =
    today > PLAN_END ? PLAN_END : today < PLAN_START ? PLAN_START : today;

  const sevenDaysAgo = new Date(clampedToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const defaultFrom = sevenDaysAgo < PLAN_START ? PLAN_START : sevenDaysAgo;

  const minVal = toInputValue(PLAN_START);
  const maxVal = toInputValue(PLAN_END);
  const todayVal = toInputValue(clampedToday);
  const fromVal = toInputValue(defaultFrom);

  function dayForDate(dateVal: string): number | undefined {
    return allReadings.find((r) => {
      const [y, m, d] = r._key.split("-").map(Number);
      return toInputValue(new Date(y, m - 1, d)) === dateVal;
    })?.day;
  }

  const fromDay = dayForDate(fromVal) ?? 1;
  const todayDay = dayForDate(todayVal) ?? allReadings.length;

  section.innerHTML = `
    <details class="group">
      <summary class="flex items-center justify-between cursor-pointer select-none list-none">
        <h2 class="text-lg font-semibold text-gray-800">Catch Up</h2>
        <svg class="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </summary>
      <div class="mt-4">
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <div class="flex-1">
            <label class="text-xs font-medium text-gray-500 mb-1 block">From</label>
            <div class="flex items-center gap-1.5">
              <label class="sr-only" for="catchup-from-day">From day number</label>
              <input type="number" id="catchup-from-day" value="${fromDay}" min="1" max="365"
                class="w-16 text-center ${INPUT_CLASS}" />
              <span class="text-gray-300 text-sm">/</span>
              <label class="sr-only" for="catchup-from">From date</label>
              <input type="date" id="catchup-from"
                value="${fromVal}" min="${minVal}" max="${maxVal}"
                class="flex-1 ${INPUT_CLASS}" />
            </div>
          </div>
          <div class="flex-1">
            <label class="text-xs font-medium text-gray-500 mb-1 block">To</label>
            <div class="flex items-center gap-1.5">
              <label class="sr-only" for="catchup-to-day">To day number</label>
              <input type="number" id="catchup-to-day" value="${todayDay}" min="1" max="365"
                class="w-16 text-center ${INPUT_CLASS}" />
              <span class="text-gray-300 text-sm">/</span>
              <label class="sr-only" for="catchup-to">To date</label>
              <input type="date" id="catchup-to"
                value="${todayVal}" min="${minVal}" max="${maxVal}"
                class="flex-1 ${INPUT_CLASS}" />
            </div>
          </div>
        </div>
        <div id="catchup-results" class="space-y-3"></div>
      </div>
    </details>
  `;

  const fromDayInput =
    section.querySelector<HTMLInputElement>("#catchup-from-day")!;
  const fromInput = section.querySelector<HTMLInputElement>("#catchup-from")!;
  const toDayInput =
    section.querySelector<HTMLInputElement>("#catchup-to-day")!;
  const toInput = section.querySelector<HTMLInputElement>("#catchup-to")!;
  const results = section.querySelector<HTMLElement>("#catchup-results")!;

  function update() {
    if (!fromInput.value || !toInput.value) return;
    const start = parseInputDate(fromInput.value);
    const end = parseInputDate(toInput.value);
    if (start > end) {
      results.innerHTML = `<p class="text-sm text-amber-600">Start date must be before end date.</p>`;
      return;
    }
    renderResults(results, findByDateRange(allReadings, start, end));
  }

  fromDayInput.addEventListener("change", (e) => {
    const reading = allReadings.find(
      (r) => r.day === parseInt((e.target as HTMLInputElement).value, 10),
    );
    if (!reading) return;
    const [y, m, d] = reading._key.split("-").map(Number);
    fromInput.value = toInputValue(new Date(y, m - 1, d));
    update();
  });

  fromInput.addEventListener("change", (e) => {
    const day = dayForDate((e.target as HTMLInputElement).value);
    if (day !== undefined) fromDayInput.value = String(day);
    update();
  });

  toDayInput.addEventListener("change", (e) => {
    const reading = allReadings.find(
      (r) => r.day === parseInt((e.target as HTMLInputElement).value, 10),
    );
    if (!reading) return;
    const [y, m, d] = reading._key.split("-").map(Number);
    toInput.value = toInputValue(new Date(y, m - 1, d));
    update();
  });

  toInput.addEventListener("change", (e) => {
    const day = dayForDate((e.target as HTMLInputElement).value);
    if (day !== undefined) toDayInput.value = String(day);
    update();
  });

  update();
}
