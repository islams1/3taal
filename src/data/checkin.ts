export type YesNo = 'Yes' | 'No'

export type CheckinAnswers = {
  weight: string
  prevWeight: string
  training: number | null
  diet: number | null
  cardio: number | null
  lowSleep: YesNo | null
  soreness: YesNo | null
  progress: string
  problems: string
  harderDiet: string
  uncomfortable: string
  support: string
}

export const EMPTY_ANSWERS: CheckinAnswers = {
  weight: '',
  prevWeight: '',
  training: null,
  diet: null,
  cardio: null,
  lowSleep: null,
  soreness: null,
  progress: '',
  problems: '',
  harderDiet: '',
  uncomfortable: '',
  support: '',
}

type Key = keyof CheckinAnswers

export type Question =
  | { n: number; kind: 'rating'; key: Key; text: string }
  | { n: number; kind: 'yesno'; key: Key; text: string }
  | { n: number; kind: 'choice'; key: Key; text: string; options: string[] }
  | { n: number; kind: 'text'; key: Key; text: string }

export const QUESTIONS: Question[] = [
  { n: 1, kind: 'rating', key: 'training', text: 'How would you rate your training commitment last week, out of 10?' },
  { n: 2, kind: 'rating', key: 'diet', text: 'How would you rate your diet commitment last week, out of 10?' },
  { n: 3, kind: 'rating', key: 'cardio', text: 'How would you rate your cardio commitment last week, out of 10?' },
  { n: 4, kind: 'yesno', key: 'lowSleep', text: 'Did you sleep less than 6 hours a night last week?' },
  { n: 5, kind: 'yesno', key: 'soreness', text: 'Are you getting severe body soreness after training?' },
  { n: 6, kind: 'text', key: 'progress', text: 'How do you feel about your progress?' },
  { n: 7, kind: 'text', key: 'problems', text: 'Is anything in your training or diet giving you trouble that needs adjusting?' },
  {
    n: 8, kind: 'choice', key: 'harderDiet', text: 'Do you think you can handle a slightly stricter diet, or is the current one better?',
    options: ['I can go a bit stricter', 'Current is better'],
  },
  { n: 9, kind: 'text', key: 'uncomfortable', text: 'Is anything in the training program or nutrition plan uncomfortable and needs changing?' },
  { n: 10, kind: 'text', key: 'support', text: 'What else could I offer to help you more on your journey?' },
]

/** Answers that must be filled before sending. */
export const REQUIRED: Key[] = ['weight', 'training', 'diet', 'cardio', 'lowSleep', 'soreness']

export const MAX_PHOTOS = 6
