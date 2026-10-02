export type CheckinAnswers = {
  weight: string
  prevWeight: string
  training: number | null
  diet: number | null
  cardio: number | null
  lowSleep: 'نعم' | 'لا' | null
  soreness: 'نعم' | 'لا' | null
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
  { n: 1, kind: 'rating', key: 'training', text: 'شايف التزامك في التمرين كان كام من ١٠ الاسبوع اللي فات؟' },
  { n: 2, kind: 'rating', key: 'diet', text: 'شايف التزامك في الدايت كان كام من ١٠ الاسبوع اللي فات؟' },
  { n: 3, kind: 'rating', key: 'cardio', text: 'شايف التزامك في الكارديو كان كام من ١٠ الاسبوع اللي فات؟' },
  { n: 4, kind: 'yesno', key: 'lowSleep', text: 'هل كان النوم أقل من ٦ ساعات الاسبوع اللي فات؟' },
  { n: 5, kind: 'yesno', key: 'soreness', text: 'هل بتعاني من وجع جسم شديد بعد التمرين ولا لا؟' },
  { n: 6, kind: 'text', key: 'progress', text: 'ايه شعورك عن التطور اللي بيحصل؟' },
  { n: 7, kind: 'text', key: 'problems', text: 'هل فيه مشكلة بتواجهك في التمرين أو الدايت و شايف انها محتاجة تتعدل؟' },
  {
    n: 8, kind: 'choice', key: 'harderDiet', text: 'شايف انك عندك القدرة ان الدايت يكون قاسي شوية عن كده ولا كده أحسن؟',
    options: ['أقدر يكون أقسى شوية', 'كده أحسن'],
  },
  { n: 9, kind: 'text', key: 'uncomfortable', text: 'هل فيه أي حاجة مش مريحاك في البرنامج التدريبي او النظام الغذائي محتاجة تتعدل؟' },
  { n: 10, kind: 'text', key: 'support', text: 'شايف ايه الحاجات اللي أقدر اقدمهالك تساعدك في رحلتك بشكل أكبر؟' },
]

/** Answers that must be filled before sending. */
export const REQUIRED: Key[] = ['weight', 'training', 'diet', 'cardio', 'lowSleep', 'soreness']

export const MAX_PHOTOS = 6
