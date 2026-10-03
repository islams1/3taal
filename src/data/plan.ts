export type Exercise = {
  id: string
  name: string
  warmupSets: string
  workingSets: number
  reps: string
  rir: string
  rest: string
  video: string
}

export type Day = {
  id: string
  number: number
  label: string
  photo: string
  exercises: Exercise[]
}

export const DAYS: Day[] = [
  {
    "id": "day1",
    "number": 1,
    "label": "upper",
    "photo": "img/s07.jpg",
    "exercises": [
      {
        "id": "d1e0",
        "name": "Incline chest press",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=DOSNVwBaCE0&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=15&pp=iAQB"
      },
      {
        "id": "d1e1",
        "name": "Flat chest press machine",
        "warmupSets": "",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=1BPUycDP-Vw&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=14&pp=iAQB"
      },
      {
        "id": "d1e2",
        "name": "Wide grip latpulldown",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=eTy8dMwWptc&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=55&pp=iAQB"
      },
      {
        "id": "d1e3",
        "name": "Cable y raises",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=9zhh-aGUrcs&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=20&pp=iAQB"
      },
      {
        "id": "d1e4",
        "name": "Smith shrugs",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=zuTk3lyYoMA&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=79&pp=iAQB"
      },
      {
        "id": "d1e5",
        "name": "Rope triceps pushdown",
        "warmupSets": "",
        "workingSets": 3,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=jIKXu_m_WxM&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=13&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d1e6",
        "name": "Biceps bayesian curl",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=KbSCjlMnuwQ&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=22&pp=iAQB"
      }
    ]
  },
  {
    "id": "day2",
    "number": 2,
    "label": "lower",
    "photo": "img/s09.jpg",
    "exercises": [
      {
        "id": "d2e0",
        "name": "Leg press machine ( selective )",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=1QlJC8ezMvE&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=42&pp=iAQB"
      },
      {
        "id": "d2e1",
        "name": "Barbell RDLS",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=zoYMNYMk1rM&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=52&pp=iAQB"
      },
      {
        "id": "d2e2",
        "name": "Leg extension machine",
        "warmupSets": "",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=Es1dBdx448g&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=61&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d2e3",
        "name": "Lying leg curl",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=T275UXpIXug&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=41&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d2e4",
        "name": "Adductors machine",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=EZzpfk62hDA&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=62&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d2e5",
        "name": "Smith standing calf raises",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=p_T9O2gHwPA&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=36&pp=iAQB"
      },
      {
        "id": "d2e6",
        "name": "Cable wrist flexion",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=96GqFgO4-Cs&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=86&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d2e7",
        "name": "Abdominal crunches",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=vBBuMTmJQHw&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=74&pp=iAQB"
      }
    ]
  },
  {
    "id": "day3",
    "number": 3,
    "label": "upper",
    "photo": "img/s12.jpg",
    "exercises": [
      {
        "id": "d3e0",
        "name": "T bar machine",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=JohmkrpUJK4&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=53&pp=iAQB"
      },
      {
        "id": "d3e1",
        "name": "DB incline chest press",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=ZT78Lf66NXw&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=4&pp=iAQB"
      },
      {
        "id": "d3e2",
        "name": "Close grip seated row",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=2TmJNXAKv6M&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=76&pp=iAQB"
      },
      {
        "id": "d3e3",
        "name": "Db lateral raises",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=U6-py46Cdnc&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=50&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d3e4",
        "name": "Cable rear delt fly",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=2-FOMAlhuD0&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=25&pp=iAQB"
      },
      {
        "id": "d3e5",
        "name": "Rope overhead extension",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=OKoLcDpJGrM&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=11&pp=iAQB"
      },
      {
        "id": "d3e6",
        "name": "Preacher curl machine",
        "warmupSets": "",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=J91F-AooMDI&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=49&pp=iAQB"
      }
    ]
  },
  {
    "id": "day4",
    "number": 4,
    "label": "chest & back",
    "photo": "img/s15.jpg",
    "exercises": [
      {
        "id": "d4e0",
        "name": "Incline chest press",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=DOSNVwBaCE0&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=15&pp=iAQB"
      },
      {
        "id": "d4e1",
        "name": "T bar machine",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=JohmkrpUJK4&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=53&pp=iAQB"
      },
      {
        "id": "d4e2",
        "name": "Chest fly machine",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=GWq3xgNzRpk&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=16&pp=iAQB"
      },
      {
        "id": "d4e3",
        "name": "Wide grip latpulldown",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=eTy8dMwWptc&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=55&pp=iAQB"
      },
      {
        "id": "d4e4",
        "name": "Close grip seated row",
        "warmupSets": "1",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=2TmJNXAKv6M&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=76&pp=iAQB"
      },
      {
        "id": "d4e5",
        "name": "Decline fly machine",
        "warmupSets": "",
        "workingSets": 3,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=fSPvqo89KNg&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=5&pp=iAQB"
      },
      {
        "id": "d4e6",
        "name": "Cable torso rotation",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=-FWq-UK9FQ8&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=77&pp=iAQB"
      }
    ]
  },
  {
    "id": "day5",
    "number": 5,
    "label": "SHOULDERS AND ARMS",
    "photo": "img/s17.jpg",
    "exercises": [
      {
        "id": "d5e0",
        "name": "DB shoulder press",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=H0A51QQYS9E&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=29&pp=iAQB"
      },
      {
        "id": "d5e1",
        "name": "Db lateral raises",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=U6-py46Cdnc&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=50&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d5e2",
        "name": "Rear delt fly machine",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=0838Or0PCR8&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=48&pp=iAQB"
      },
      {
        "id": "d5e3",
        "name": "Rope overhead extension",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=OKoLcDpJGrM&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=11&pp=iAQB"
      },
      {
        "id": "d5e4",
        "name": "Preacher curl machine",
        "warmupSets": "1",
        "workingSets": 3,
        "reps": "8-12 reps",
        "rir": "1-0",
        "rest": "2-3 min",
        "video": "https://www.youtube.com/watch?v=J91F-AooMDI&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=49&pp=iAQB"
      },
      {
        "id": "d5e5",
        "name": "Rope triceps pushdown",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=jIKXu_m_WxM&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=13&pp=iAQB0gcJCa4KAYcqIYzv"
      },
      {
        "id": "d5e6",
        "name": "Cable wrist extension",
        "warmupSets": "",
        "workingSets": 2,
        "reps": "10-12 reps",
        "rir": "1-0",
        "rest": "1.5-2 min",
        "video": "https://www.youtube.com/watch?v=rUzy1WICMLA&list=PLlvCYMcR6vcVpeIUZgkFaQWZKGF49w5Bz&index=87&pp=iAQB"
      }
    ]
  }
]
