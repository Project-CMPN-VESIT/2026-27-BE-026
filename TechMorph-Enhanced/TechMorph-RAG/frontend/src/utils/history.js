const KEY = "techmorph_history";

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(item) {
  const history = getHistory();
  const next = [item, ...history].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteHistory(id) {
  const next = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
