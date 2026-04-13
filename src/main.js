import './style.css'
import { loadReadings, findToday, findByDate } from './readings.js'
import {
  getSavedTime,
  isEnabled,
  enable,
  disable,
  updateTime,
  resumeSchedule,
  showIfNotYetToday,
} from './notifications.js'

const PLAN_START = new Date('2026-03-28')
const PLAN_END = new Date('2027-03-27')

// Format an "HH:MM" string explicitly as 24-hour (e.g. "08:00", "20:30")
function format24h(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

// Navigation state — null means "today"
let _viewDate = null
let _readings = []

function viewDate() {
  return _viewDate ?? new Date()
}

function isToday() {
  if (!_viewDate) return true
  const t = new Date()
  return _viewDate.getFullYear() === t.getFullYear() &&
    _viewDate.getMonth() === t.getMonth() &&
    _viewDate.getDate() === t.getDate()
}

async function init() {
  _readings = await loadReadings()

  const today = findToday(_readings)
  renderReading(today)
  renderNav()
  renderNotifications()
  resumeSchedule()
  showIfNotYetToday(today)
}

function navigate(offsetDays) {
  const base = viewDate()
  const next = new Date(base)
  next.setDate(next.getDate() + offsetDays)

  // Clamp to plan bounds
  if (next < PLAN_START) return
  if (next > PLAN_END) return

  // If navigating to today, clear the override
  const t = new Date()
  if (next.getFullYear() === t.getFullYear() &&
      next.getMonth() === t.getMonth() &&
      next.getDate() === t.getDate()) {
    _viewDate = null
  } else {
    _viewDate = next
  }

  renderReading(findByDate(_readings, viewDate()))
  renderNav()
}

function jumpToDate(dateStr) {
  // dateStr is "YYYY-MM-DD" from the date input
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)

  if (target < PLAN_START || target > PLAN_END) return

  const t = new Date()
  if (target.getFullYear() === t.getFullYear() &&
      target.getMonth() === t.getMonth() &&
      target.getDate() === t.getDate()) {
    _viewDate = null
  } else {
    _viewDate = target
  }

  renderReading(findByDate(_readings, viewDate()))
  renderNav()
}

function renderNav() {
  const container = document.getElementById('day-nav')
  if (!container) return

  const current = viewDate()
  const atStart = current <= PLAN_START
  const atEnd = current >= PLAN_END

  // Format date value for the input as YYYY-MM-DD
  const pad = n => String(n).padStart(2, '0')
  const inputVal = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
  const minVal = `${PLAN_START.getFullYear()}-${pad(PLAN_START.getMonth() + 1)}-${pad(PLAN_START.getDate())}`
  const maxVal = `${PLAN_END.getFullYear()}-${pad(PLAN_END.getMonth() + 1)}-${pad(PLAN_END.getDate())}`

  container.innerHTML = `
    <div class="flex items-center gap-2">
      <button id="nav-prev" aria-label="Previous day"
        class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        ${atStart ? 'disabled' : ''}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <input type="date" id="nav-date" value="${inputVal}" min="${minVal}" max="${maxVal}"
        class="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-methodist-red" />

      <button id="nav-next" aria-label="Next day"
        class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        ${atEnd ? 'disabled' : ''}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      ${!isToday() ? `
        <button id="nav-today"
          class="ml-auto text-xs font-medium text-methodist-red hover:underline">
          Today
        </button>` : ''}
    </div>
  `

  document.getElementById('nav-prev')?.addEventListener('click', () => navigate(-1))
  document.getElementById('nav-next')?.addEventListener('click', () => navigate(+1))
  document.getElementById('nav-date')?.addEventListener('change', e => jumpToDate(e.target.value))
  document.getElementById('nav-today')?.addEventListener('click', () => {
    _viewDate = null
    renderReading(findToday(_readings))
    renderNav()
  })
}

function renderReading(reading) {
  const container = document.getElementById('reading-card')
  if (!container) return

  // Update the date display to match the viewed day
  const el = document.getElementById('today-date')
  if (el) {
    el.textContent = viewDate().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  if (!reading) {
    const now = viewDate()
    let message
    if (now < PLAN_START) {
      message = `The reading plan begins on <strong>28 March 2026</strong>. See you then!`
    } else if (now > PLAN_END) {
      message = `The reading plan concluded on <strong>27 March 2027</strong>. Well done for completing the journey!`
    } else {
      message = `No reading found for this date.`
    }
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p class="text-lg">${message}</p>
      </div>`
    return
  }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold uppercase tracking-wide text-methodist-red">Day ${reading.day} of 365</span>
        <span class="text-sm text-gray-500">${reading.dayOfWeek}</span>
      </div>

      <div class="reading-row">
        <div class="reading-label">Old Testament</div>
        <div class="reading-passage">${reading.ot}</div>
      </div>

      <div class="reading-row">
        <div class="reading-label">Psalm / Proverb</div>
        <div class="reading-passage">${reading.psalmProverb}</div>
      </div>

      <div class="reading-row">
        <div class="reading-label">New Testament</div>
        <div class="reading-passage">${reading.nt}</div>
      </div>

      ${reading.audioRef ? `
      <div class="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5L6 9H2v6h4l5 4V5zM15.536 8.464a5 5 0 010 7.072M19.07 4.929a10 10 0 010 14.142"/>
        </svg>
        <span>Audio Bible ref: <strong>${reading.audioRef}</strong>
          &nbsp;·&nbsp; NIV read by David Suchet (Bible in One Year — Audible)
        </span>
      </div>` : ''}
    </div>`
}

function renderNotifications() {
  const section = document.getElementById('notifications-section')
  if (!section) return

  const savedTime = getSavedTime()
  const enabled = isEnabled()
  const notifSupported = 'Notification' in window

  section.innerHTML = `
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Daily Notifications</h2>

    ${!notifSupported ? `
      <p class="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
        Notifications are not supported in this browser.
      </p>` : ''}

    ${notifSupported ? `
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700 w-28 shrink-0" for="notif-time">
            Notify me at
          </label>
          <input
            type="time"
            id="notif-time"
            value="${savedTime || '08:00'}"
            step="60"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-methodist-red [&::-webkit-date-and-time-value]:text-left"
            style="font-variant-numeric: tabular-nums;"
          />
          <span class="text-xs text-gray-400">24hr</span>
        </div>

        <div class="flex gap-3">
          <button id="btn-enable"
            class="btn-primary ${enabled ? 'hidden' : ''}">
            Enable notifications
          </button>
          <button id="btn-disable"
            class="btn-secondary ${enabled ? '' : 'hidden'}">
            Disable notifications
          </button>
        </div>

        <p id="notif-status" class="text-sm ${enabled ? 'text-green-600' : 'text-gray-400'}">
          ${enabled ? `✓ Notifications enabled at ${format24h(savedTime)}` : 'Notifications are off'}
        </p>

        <!-- iOS instructions -->
        <details class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          <summary class="cursor-pointer font-medium text-gray-700 select-none">
            📱 Using an iPhone or iPad?
          </summary>
          <div class="mt-3 space-y-2">
            <p>For notifications to work on iOS you must first add this app to your Home Screen:</p>
            <ol class="list-decimal list-inside space-y-1 ml-1">
              <li>Tap the <strong>Share</strong> button <span class="text-base">⬆</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>Add</strong> in the top right</li>
              <li>Open the app from your Home Screen and enable notifications here</li>
            </ol>
            <p class="text-xs text-gray-500 pt-1">Requires iOS 16.4 or later with Safari.</p>
          </div>
        </details>
      </div>
    ` : ''}
  `

  if (!notifSupported) return

  document.getElementById('notif-time')?.addEventListener('change', e => {
    if (enabled) {
      updateTime(e.target.value)
      document.getElementById('notif-status').textContent =
        `✓ Notifications enabled at ${format24h(e.target.value)}`
    }
  })

  document.getElementById('btn-enable')?.addEventListener('click', async () => {
    const time = document.getElementById('notif-time').value
    const result = await enable(time)
    if (result.ok) {
      renderNotifications()
    } else if (result.reason === 'denied') {
      document.getElementById('notif-status').textContent =
        '⚠️ Permission denied. Please allow notifications in your browser settings.'
      document.getElementById('notif-status').className = 'text-sm text-amber-600'
    }
  })

  document.getElementById('btn-disable')?.addEventListener('click', () => {
    disable()
    renderNotifications()
  })
}

init()
