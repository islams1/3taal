import { QUESTIONS, type CheckinAnswers } from '../data/checkin'

/** Coach's WhatsApp number in international format (Egypt +20, no leading 0). */
export const COACH_WHATSAPP = '201015453093'

const dash = (v: unknown) => (v === null || v === undefined || String(v).trim() === '' ? '—' : String(v).trim())

/** Plain-text summary of a check-in, formatted for WhatsApp (*bold* works there). */
export function checkinMessage(a: CheckinAnswers, photoCount: number, photosFolder?: string): string {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const lines = [
    '*Weekly check-in* 📋',
    `📅 ${date}`,
    '',
    `Current weight = ${dash(a.weight)}`,
    `Previous weight = ${dash(a.prevWeight)}`,
    '',
  ]
  for (const q of QUESTIONS) {
    const v = a[q.key]
    lines.push(`*${q.n}) ${q.text}*`, q.kind === 'rating' ? `${dash(v)} / 10` : dash(v), '')
  }
  lines.push(
    '*11) Photos on an empty stomach*',
    photosFolder ? `📸 ${photoCount} photos: ${photosFolder}` : photoCount ? `📸 ${photoCount} photos uploaded on the site` : 'No photos',
  )
  return lines.join('\n')
}

export const whatsappLink = (text: string) => `https://wa.me/${COACH_WHATSAPP}?text=${encodeURIComponent(text)}`
