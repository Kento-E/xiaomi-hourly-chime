const MINUTE_MS = 60 * 1000

export const DEFAULT_TIMING = {
  shortGapMs: 400,
  longGapMs: 600,
  groupGapMs: 900
}

/**
 * Next fire time (ms) strictly after `now`, aligned to local-time boundaries.
 * @param {number} now epoch ms
 * @param {number} intervalMin 60 (default) or 30
 */
export function nextBoundary(now, intervalMin = 60) {
  if (intervalMin !== 60 && intervalMin !== 30) {
    throw new RangeError('intervalMin must be 60 or 30')
  }
  const d = new Date(now)
  d.setMinutes(0, 0, 0)
  let t = d.getTime()
  const step = intervalMin * MINUTE_MS
  while (t <= now) {
    t += step
  }
  return t
}

/**
 * Quiet-hour check on the hour of `date`. Range is [start, end) and may wrap
 * past midnight (e.g. 23 to 7). start === end means quiet hours are disabled.
 * @param {Date} date
 * @param {number} start 0-23
 * @param {number} end 0-23
 */
export function isQuietHour(date, start, end) {
  if (start === end) return false
  const h = date.getHours()
  if (start < end) return h >= start && h < end
  return h >= start || h < end
}

/**
 * Vibration pattern. On the hour: 12-hour clock (0 -> 12), long = 5 hours,
 * short = 1 hour. Any other minute: a single short vibration.
 * gapMs is the wait after that vibration (0 for the last one).
 * @param {number} hour24 0-23
 * @param {number} minute 0-59
 * @param {{shortGapMs:number,longGapMs:number,groupGapMs:number}} [timing]
 * @returns {{type:'long'|'short', gapMs:number}[]}
 */
export function buildPattern(hour24, minute, timing = DEFAULT_TIMING) {
  const { shortGapMs, longGapMs, groupGapMs } = timing
  if (minute !== 0) {
    return [{ type: 'short', gapMs: 0 }]
  }
  const h12 = hour24 % 12 || 12
  const longs = Math.floor(h12 / 5)
  const shorts = h12 % 5
  const pattern = []
  for (let i = 0; i < longs; i++) {
    const isLastOfGroup = i === longs - 1
    pattern.push({
      type: 'long',
      gapMs: isLastOfGroup && shorts > 0 ? groupGapMs : longGapMs
    })
  }
  for (let i = 0; i < shorts; i++) {
    pattern.push({ type: 'short', gapMs: shortGapMs })
  }
  pattern[pattern.length - 1].gapMs = 0
  return pattern
}
