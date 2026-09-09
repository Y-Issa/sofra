/** Exact > starts-with > contains > any-word-starts-with. Returns -1 for no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  if (t.split(/\s+/).some((word) => word.startsWith(q))) return 50;
  return -1;
}

/** Filters and ranks items by fuzzy match on `getText(item)`. Empty query returns all items, unranked. */
export function fuzzyFilter<T>(query: string, items: T[], getText: (item: T) => string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
