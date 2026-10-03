/**
 * Backend for the Workout Plan site, bound to the "islam sherif progress" spreadsheet.
 *  - finished workouts  → first tab (one row per exercise)
 *  - weekly check-ins   → "Check-ins" tab, photos saved to a Drive folder
 *
 * Setup: open the spreadsheet → Extensions → Apps Script → paste this file →
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * After editing: Deploy → Manage deployments → ✏️ → Version: New version.
 *
 * Passwords (Project Settings → Script properties):
 *   TRAINEE_PIN  - Islam: can log workouts / check-ins and read everything
 *   COACH_PIN    - Shady: read only
 * While neither is set the web app stays open (no password), as before.
 */

const CHECKIN_TAB = 'Check-ins';
const PHOTOS_FOLDER = 'islam sherif progress – photos';
const CHECKIN_HEADERS = [
  'Date', 'Current weight (kg)', 'Previous weight (kg)', 'Change (kg)',
  'Training /10', 'Diet /10', 'Cardio /10', 'Slept < 6h', 'Severe soreness',
  'Feeling about progress', 'Problems in training / diet', 'Diet harder?',
  'Anything uncomfortable', 'What can I offer', 'Photos',
];

/** 'trainee' | 'coach' | 'open' (no passwords configured) | null (wrong password) */
function roleFor(pin) {
  const props = PropertiesService.getScriptProperties();
  const trainee = props.getProperty('TRAINEE_PIN');
  const coach = props.getProperty('COACH_PIN');
  if (!trainee && !coach) return 'open';
  if (pin && trainee && String(pin) === trainee) return 'trainee';
  if (pin && coach && String(pin) === coach) return 'coach';
  return null;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const role = roleFor(data.pin);
    if (role !== 'trainee' && role !== 'open') return json({ ok: false, error: 'unauthorized' });
    return json(data.type === 'checkin' ? saveCheckin(data) : saveWorkout(data));
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET ?view=auth      → which role the password belongs to
 * GET ?view=history   → every finished workout (see workoutHistory)
 * GET ?view=checkins  → every weekly check-in, newest first
 * GET                 → latest "Current weight" per exercise + latest check-in weight
 * Every call needs &pin=... once passwords are set.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const role = roleFor(p.pin);
  if (!role) return json({ ok: false, error: 'unauthorized' });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (p.view === 'auth') return json({ ok: true, role: role });
  if (p.view === 'history') return json({ ok: true, sessions: workoutHistory(ss) });
  if (p.view === 'checkins') return json({ ok: true, checkins: checkinHistory(ss) });
  return json({ ok: true, sheet: ss.getName(), last: lastWeights(ss), lastCheckin: lastCheckin(ss) });
}

function saveWorkout(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const date = new Date(data.date);
  const cardio = data.cardio == null ? '' : data.cardio;
  const diet = data.diet == null ? '' : data.diet;
  const rows = data.rows.map(r => [
    date, 'Day ' + data.dayNumber, data.dayLabel, r.exercise,
    r.prev, r.cur, r.change, r.done, r.target, r.commitment / 100, r.failure, data.id || '', cardio, diet,
    r.reps == null ? '' : r.reps,
  ]);
  // only cardio / diet answered: still record the day on one row
  if (!rows.length && (cardio !== '' || diet !== '')) {
    rows.push([date, 'Day ' + data.dayNumber, data.dayLabel, '', '', '', '', '', '', '', '', data.id || '', cardio, diet, '']);
  }
  // L groups one finished workout's rows into a session (the site's "View" history); M/N are the day's ratings
  ensureHeader(sheet, 12, 'Session');
  ensureHeader(sheet, 13, 'Cardio /10');
  ensureHeader(sheet, 14, 'Diet /10');
  ensureHeader(sheet, 15, 'Reps (lowest set)');
  if (rows.length) {
    const start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
    sheet.getRange(start, 1, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(start, 10, rows.length, 1).setNumberFormat('0%');
  }
  return { ok: true, added: rows.length };
}

function ensureHeader(sheet, col, title) {
  if (sheet.getRange(1, col).getValue() === '') sheet.getRange(1, col).setValue(title).setFontWeight('bold');
}

function saveCheckin(data) {
  const a = data.answers;
  const date = new Date(data.date);
  const cur = num(a.weight), prev = num(a.prevWeight);
  const saved = savePhotos(data.photos || [], date);
  const links = saved.links;

  const sheet = checkinSheet();
  sheet.appendRow([
    date, cur, prev, cur !== '' && prev !== '' ? Math.round((cur - prev) * 100) / 100 : '',
    a.training, a.diet, a.cardio, a.lowSleep, a.soreness,
    a.progress, a.problems, a.harderDiet, a.uncomfortable, a.support,
    links.join('\n'),
  ]);
  const row = sheet.getLastRow();
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange(row, 1, 1, CHECKIN_HEADERS.length).setVerticalAlignment('top').setWrap(true);
  return { ok: true, photos: links.length, photosFolder: saved.folder };
}

function checkinSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CHECKIN_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(CHECKIN_TAB, ss.getSheets().length);
    sheet.appendRow(CHECKIN_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CHECKIN_HEADERS.length).setFontWeight('bold');
    sheet.setRightToLeft(false);
  }
  return sheet;
}

/** Each check-in gets its own dated sub-folder; returns the file links and the folder link. */
function savePhotos(photos, date) {
  if (!photos.length) return { links: [], folder: '' };
  const it = DriveApp.getFoldersByName(PHOTOS_FOLDER);
  const root = it.hasNext() ? it.next() : DriveApp.createFolder(PHOTOS_FOLDER);
  const stamp = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH-mm');
  const folder = root.createFolder('Check-in ' + stamp);
  const links = photos.map((p, i) =>
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(p.data), p.type, 'photo-' + (i + 1) + '.jpg')).getUrl());
  return { links: links, folder: folder.getUrl() };
}

/** Latest "Current weight" per "<day number>|<exercise>" - next session's "Previous weight". */
function lastWeights(ss) {
  const values = ss.getSheets()[0].getDataRange().getValues().slice(1); // skip header row
  const last = {};
  for (const row of values) {
    const [date, day, , exercise, , cur] = row;
    if (cur === '' || cur === null || !exercise) continue;
    const key = String(day).replace(/\D/g, '') + '|' + exercise;
    const time = date instanceof Date ? date.getTime() : new Date(date).getTime();
    if (!last[key] || time >= last[key].time) last[key] = { weight: Number(cur), time: time };
  }
  const out = {};
  for (const k in last) out[k] = { weight: last[k].weight, date: new Date(last[k].time).toISOString() };
  return out;
}

function lastCheckin(ss) {
  const ck = ss.getSheetByName(CHECKIN_TAB);
  if (!ck || ck.getLastRow() < 2) return null;
  const rows = ck.getRange(2, 1, ck.getLastRow() - 1, 2).getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i][1] !== '') return { weight: Number(rows[i][1]), date: new Date(rows[i][0]).toISOString() };
  }
  return null;
}

/** Every finished workout, newest first, with its exercise rows - as logged. */
function workoutHistory(ss) {
  const values = ss.getSheets()[0].getDataRange().getValues().slice(1);
  const sessions = {};
  for (const row of values) {
    const [date, day, label, exercise, prev, cur, change, done, target, commitment, failure, session, cardio, diet, reps] = row;
    if (!date) continue;
    const iso = (date instanceof Date ? date : new Date(date)).toISOString();
    const key = session || iso + '|' + day;
    if (!sessions[key]) {
      sessions[key] = { id: String(key), date: iso, dayNumber: Number(String(day).replace(/\D/g, '')), dayLabel: label, rows: [],
        cardio: null, diet: null };
    }
    if (cardio !== '' && cardio !== undefined) sessions[key].cardio = Number(cardio);
    if (diet !== '' && diet !== undefined) sessions[key].diet = Number(diet);
    if (!exercise) continue;
    sessions[key].rows.push({
      exercise: exercise, prev: prev, cur: cur, change: change, done: done, target: target,
      commitment: typeof commitment === 'number' ? Math.round(commitment * 100) : 0,
      failure: failure, reps: reps === undefined ? '' : reps,
    });
  }
  return Object.keys(sessions).map(k => sessions[k]).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Every weekly check-in, newest first; photos as Drive links + file ids. */
function checkinHistory(ss) {
  const ck = ss.getSheetByName(CHECKIN_TAB);
  if (!ck || ck.getLastRow() < 2) return [];
  const rows = ck.getRange(2, 1, ck.getLastRow() - 1, CHECKIN_HEADERS.length).getValues();
  return rows.filter(r => r[0] !== '').map(r => ({
    date: (r[0] instanceof Date ? r[0] : new Date(r[0])).toISOString(),
    weight: r[1], prevWeight: r[2], change: r[3],
    training: r[4], diet: r[5], cardio: r[6], lowSleep: r[7], soreness: r[8],
    progress: r[9], problems: r[10], harderDiet: r[11], uncomfortable: r[12], support: r[13],
    photos: String(r[14] || '').split('\n').filter(Boolean).map(url => {
      const m = url.match(/\/d\/([\w-]+)/);
      return { url: url, id: m ? m[1] : '' };
    }),
  })).reverse();
}

/**
 * Run this once from the Apps Script editor (select it, press Run) to wipe the
 * test data before real use: keeps the header rows, deletes everything else.
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [ss.getSheets()[0], ss.getSheetByName(CHECKIN_TAB)].filter(Boolean);
  for (const sheet of sheets) {
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? '' : n;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
