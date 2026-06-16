export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  for (const key of keys) {
    delete (result as Record<string, unknown>)[key as string];
  }
  return result;
}

export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      output[key] = deepMerge(target[key] as Record<string, unknown>, val as Record<string, unknown>) as T[keyof T];
    } else if (val !== undefined) {
      output[key] = val as T[keyof T];
    }
  }
  return output;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  const cloned: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return cloned as T;
}

export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => isEqual(val, b[idx]));
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

export function removeEmptyKeys<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const val = obj[key];
    if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      result[key] = val;
    }
  }
  return result;
}
