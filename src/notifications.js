import { loadReadings, findToday } from './readings.js'

const KEY_TIME = 'notifTime'       // stored as "HH:MM"
const KEY_LAST = 'lastNotifiedDay' // stored as "YYYY-M-D"

let _scheduleTimer = null

export function getSavedTime() {
  return localStorage.getItem(KEY_TIME)
}

export function isEnabled() {
  return !!getSavedTime() && Notification.permission === 'granted'
}

export async function enable(time) {
  if (!('Notification' in window)) return { ok: false, reason: 'unsupported' }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }
  localStorage.setItem(KEY_TIME, time)
  scheduleNext()
  return { ok: true }
}

export function disable() {
  localStorage.removeItem(KEY_TIME)
  if (_scheduleTimer) {
    clearTimeout(_scheduleTimer)
    _scheduleTimer = null
  }
}

export function updateTime(time) {
  localStorage.setItem(KEY_TIME, time)
  if (_scheduleTimer) clearTimeout(_scheduleTimer)
  scheduleNext()
}

// Called on page load if notifications are already enabled
export function resumeSchedule() {
  if (isEnabled()) scheduleNext()
}

// Show notification immediately if today's hasn't been shown yet
export function showIfNotYetToday(reading) {
  if (!isEnabled() || !reading) return
  if (localStorage.getItem(KEY_LAST) === _todayKey()) return
  _fireNotification(reading)
}

function scheduleNext() {
  const time = getSavedTime()
  if (!time) return

  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)

  const delay = target - now
  _scheduleTimer = setTimeout(async () => {
    const readings = await loadReadings()
    const reading = findToday(readings)
    if (reading) _fireNotification(reading)
    scheduleNext()
  }, delay)
}

function _fireNotification(reading) {
  if (Notification.permission !== 'granted') return
  localStorage.setItem(KEY_LAST, _todayKey())

  const body = [
    `OT: ${reading.ot}`,
    `Psalm/Proverb: ${reading.psalmProverb}`,
    `NT: ${reading.nt}`,
  ].join('\n')

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: `Bible in a Year — Day ${reading.day}`,
      body,
      tag: 'daily-reading',
    })
  } else {
    new Notification(`Bible in a Year — Day ${reading.day}`, {
      body,
      icon: './icon-192.png',
      tag: 'daily-reading',
    })
  }
}

function _todayKey() {
  const n = new Date()
  return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`
}

