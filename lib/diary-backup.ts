import { DiaryItem, getDiaryItems, saveDiaryItem } from "@/lib/diary-db";

type DiaryBackupPayload = {
  schemaVersion: 1;
  exportedAt: string;
  entries: DiaryItem[];
};

export async function exportDiaryBackup(): Promise<string> {
  const entries = await getDiaryItems();
  const payload: DiaryBackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importDiaryBackup(rawBackup: string): Promise<number> {
  const payload = JSON.parse(rawBackup) as Partial<DiaryBackupPayload>;

  if (payload.schemaVersion !== 1 || !Array.isArray(payload.entries)) {
    throw new Error("지원하지 않는 백업 파일입니다.");
  }

  for (const entry of payload.entries) {
    if (!entry.id || !entry.date) {
      throw new Error("백업 파일에 잘못된 일기 데이터가 포함되어 있습니다.");
    }

    await saveDiaryItem({
      id: entry.id,
      date: entry.date,
      memo: entry.memo ?? "",
      temp: entry.temp,
      weather: entry.weather,
      image: entry.image,
    });
  }

  return payload.entries.length;
}
