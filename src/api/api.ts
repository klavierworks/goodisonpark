import db from "./db.json";

export type Data = typeof db;

export type DataKey = keyof Data[0];

export const getGroupedData = (groupBy: DataKey) => {
  const groupedData: Record<string, Data[0][]> = {};

  db.forEach((item) => {
    const key = item[groupBy];
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    groupedData[key].push(item);
  });

  return groupedData;
}