export const createStorageValue = <T>(key: string, defaultValue: T | null) => {
  const isBrowser = typeof window !== "undefined";
  const get = (): T | null => {
    if (!isBrowser) return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  };

  const set = (value: T) => {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  };

  const remove = () => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  };

  return { get, set, remove };
};
