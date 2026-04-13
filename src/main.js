import './style.css'
import { loadReadings, findToday } from './readings.js'
import {
  getSavedTime,
  isEnabled,
  enable,
  disable,
  updateTime,
  resumeSchedule,
  showIfNotYetToday,
} from './notifications.js'

const PLAN_START = '28 March 2026'
const PLAN_END = '27 March 2027'

// Format an "HH:MM" string explicitly as 24-hour (e.g. "08:00", "20:30")
function format24h(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

async function init() {
  const readings = await loadReadings()
  const today = findToday(readings)

  renderReading(today)
  renderNotifications()
  resumeSchedule()
  showIfNotYetToday(today)
  updateTodayDate()
}

function updateTodayDate() {
  const el = document.getElementById('today-date')
  if (!el) return
  el.textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function renderReading(reading) {
  const container = document.getElementById('reading-card')
  if (!container) return

  if (!reading) {
    const now = new Date()
    const planStart = new Date('2026-03-28')
    const planEnd = new Date('2027-03-27')
    let message
    if (now < planStart) {
      message = `The reading plan begins on <strong>${PLAN_START}</strong>. See you then!`
    } else if (now > planEnd) {
      message = `The reading plan concluded on <strong>${PLAN_END}</strong>. Well done for completing the journey! 🎉`
    } else {
      message = `No reading found for today. Please check back tomorrow.`
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
