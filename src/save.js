// Saving. The game keeps one save on the phone (in the browser's storage).
// It saves at the start of every day and night, when Michael sits at the
// kitchen table with the Snakes and Ladders board, when he goes to bed, and
// the moment the game goes into the background (a call, an app switch).
const SaveGame = (() => {
  const KEY = 'cornfield-save-v1';

  function fresh() {
    return {
      chapter: 'day1',   // which day or night
      step: 0,           // how far through it
      x: null, y: null,  // where Michael was (null = the step's starting place)
      flags: {},         // things that have happened
      notes: [],         // objectives: { id, text, done }
      clues: [],         // { id, title, text }
      items: [],         // e.g. 'rosary'
      stones: 12,        // stones left in the ring
      savedAt: null,
    };
  }

  let state = fresh();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      state = Object.assign(fresh(), JSON.parse(raw));
      return state;
    } catch (e) {
      return null;
    }
  }

  function save() {
    state.savedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  function exists() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }

  function startNew() {
    state = fresh();
    return state;
  }

  return {
    get state() { return state; },
    load, save, exists, startNew,
  };
})();

// Chapter names, for the start screen and notebook.
const CHAPTER_NAMES = {
  prologue: 'Prologue: Come see',
  day1: 'Day 1: Homecoming',
  night1: 'Night 1: Lock up',
  day2: 'Day 2: Spike',
  night2: 'Night 2: Jason',
  day3: 'Day 3: Jenny, come here',
};

// Which chapters have been reached, for Chapters on the start screen. Kept
// apart from the save, so starting a new game doesn't lock them again.
const Unlocks = (() => {
  const KEY = 'cornfield-unlocked-v1';
  const ORDER = ['prologue', 'day1', 'night1', 'day2', 'night2', 'day3', 'night3', 'day4', 'night4', 'day5', 'night5', 'day6', 'night6', 'day7', 'finale'];

  function get() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function store(set) {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) { /* storage unavailable */ }
  }
  // Reaching a chapter unlocks it (and everything before it).
  function unlock(id) {
    const i = ORDER.indexOf(id);
    if (i < 0) return;
    const set = get();
    ORDER.slice(0, i + 1).forEach(c => set.add(c));
    store(set);
  }
  function unlockAll() { store(new Set(ORDER)); }

  return { ORDER, get, unlock, unlockAll };
})();
