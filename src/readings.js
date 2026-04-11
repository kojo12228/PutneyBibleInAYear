const MONTHS = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
}

function parseCsvDate(str) {
  const [d, m, y] = str.trim().split(' ')
  return { day: parseInt(d, 10), month: MONTHS[m], year: parseInt(y, 10) }
}

function dateKey(day, month, year) {
  return `${year}-${month}-${day}`
}

function todayKey() {
  const n = new Date()
  return dateKey(n.getDate(), n.getMonth() + 1, n.getFullYear())
}

export async function loadReadings() {
  const res = await fetch('./readings.csv')
  const text = await res.text()
  const lines = text.trim().split('\n').slice(1) // skip header row
  return lines.map(line => {
    const [day, date, dayOfWeek, ot, psalmProverb, nt, audioRef] = line.split(',')
    const parsed = parseCsvDate(date)
    return {
      day: parseInt(day, 10),
      date,
      dayOfWeek,
      ot,
      psalmProverb,
      nt,
      audioRef: audioRef?.trim(),
      _key: dateKey(parsed.day, parsed.month, parsed.year),
    }
  })
}

export function findToday(readings) {
  const key = todayKey()
  return readings.find(r => r._key === key) ?? null
}
