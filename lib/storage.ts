import { DiaryItem, getDiaryItems, saveDiaryItem } from "@/lib/diary-db";

export type DiaryRecord = {
  id: string;
  imageUri: string;
  temp: number;
  weather: string;
  weatherMain: string;
  memo?: string;
  date: string;
};

function toDiaryRecord(item: DiaryItem): DiaryRecord {
  return {
    id: item.id,
    imageUri: item.image ?? "",
    temp: item.temp ?? 0,
    weather: item.weather ?? "",
    weatherMain: item.weather ?? "",
    memo: item.memo,
    date: item.date,
  };
}

export async function saveDiaryRecord(record: DiaryRecord) {
  await saveDiaryItem({
    id: record.id,
    date: record.date,
    memo: record.memo ?? "",
    temp: record.temp,
    weather: record.weather,
    image: record.imageUri,
  });
}

export async function getDiaryRecords(): Promise<DiaryRecord[]> {
  const items = await getDiaryItems();
  return items.map(toDiaryRecord);
}

export function getSimilarDiaryRecords(
  temp: number,
  weatherMain: string,
  records: DiaryRecord[],
) {
  return records.filter((record) => {
    const isSimilarTemp = Math.abs(record.temp - temp) <= 2;
    const isSameWeather = record.weatherMain === weatherMain;

    return isSimilarTemp || isSameWeather;
  });
}
