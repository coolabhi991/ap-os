const read = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`Failed to read "${key}"`, error);
    return [];
  }
};

const write = <T>(key: string, value: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write "${key}"`, error);
  }
};

const nextId = <T extends { id: number }>(items: T[]): number => {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => item.id)) + 1;
};

export const storage = {
  read,
  write,
  nextId,
};