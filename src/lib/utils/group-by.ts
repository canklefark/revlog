export function groupByKey<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined,
  fallbackKey = "Uncategorized",
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  for (const item of items) {
    const key = keyFn(item) ?? fallbackKey;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  // Sort keys alphabetically, fallbackKey always last
  const sorted: Record<string, T[]> = {};
  const keys = Object.keys(grouped).sort((a, b) => {
    if (a === fallbackKey) return 1;
    if (b === fallbackKey) return -1;
    return a.localeCompare(b);
  });
  for (const key of keys) {
    sorted[key] = grouped[key];
  }

  return sorted;
}
