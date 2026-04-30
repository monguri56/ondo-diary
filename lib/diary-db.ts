import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { getSampleDiaryItems } from "@/lib/sample-diaries";

export type DiaryItem = {
  id: string;
  date: string;
  memo: string;
  temp?: number;
  weather?: string;
  image?: string;
};

type DiaryRow = {
  id: string;
  date: string;
  memo: string | null;
  temp: number | null;
  weather: string | null;
  image_uri: string | null;
};

type LegacyDiaryRecord = {
  id?: string;
  date?: string;
  memo?: string;
  temp?: number;
  weather?: string;
  image?: string;
  imageUri?: string;
};

const DB_NAME = "ondo-diary.db";
const LEGACY_KEYS = ["ondo_diary_items", "DIARY_RECORDS"];
const MIGRATION_KEY = "ondo_diary_sqlite_migrated_v1";

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }

  return databasePromise;
}

async function openDatabase() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS diary_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL UNIQUE,
      memo TEXT NOT NULL DEFAULT '',
      temp INTEGER,
      weather TEXT,
      image_uri TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_diary_entries_date
      ON diary_entries(date DESC);

    CREATE INDEX IF NOT EXISTS idx_diary_entries_temp_weather
      ON diary_entries(temp, weather);
  `);

  await migrateLegacyStorage(db);

  return db;
}

async function migrateLegacyStorage(db: SQLite.SQLiteDatabase) {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);

  if (migrated === "true") {
    return;
  }

  const recordsByDate = new Map<string, DiaryItem>();

  for (const key of LEGACY_KEYS) {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const legacyRecords = JSON.parse(raw) as LegacyDiaryRecord[];

      if (!Array.isArray(legacyRecords)) {
        continue;
      }

      for (const legacy of legacyRecords) {
        if (!legacy.date) {
          continue;
        }

        recordsByDate.set(legacy.date, {
          id: legacy.id ?? `${legacy.date}-${Date.now()}`,
          date: legacy.date,
          memo: legacy.memo ?? "",
          temp: legacy.temp,
          weather: legacy.weather,
          image: legacy.image ?? legacy.imageUri,
        });
      }
    } catch (error) {
      console.warn(`Failed to migrate legacy diary key: ${key}`, error);
    }
  }

  if (recordsByDate.size > 0) {
    await db.withTransactionAsync(async () => {
      for (const record of recordsByDate.values()) {
        await upsertDiaryItem(record, db);
      }
    });
  }

  await AsyncStorage.setItem(MIGRATION_KEY, "true");
}

function mapDiaryRow(row: DiaryRow): DiaryItem {
  return {
    id: row.id,
    date: row.date,
    memo: row.memo ?? "",
    temp: row.temp ?? undefined,
    weather: row.weather ?? undefined,
    image: row.image_uri ?? undefined,
  };
}

export async function getDiaryItems(): Promise<DiaryItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DiaryRow>(
    `SELECT id, date, memo, temp, weather, image_uri
     FROM diary_entries
     ORDER BY date DESC`,
  );

  return rows.map(mapDiaryRow);
}

export async function getDiaryItemByDate(
  date: string,
): Promise<DiaryItem | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DiaryRow>(
    `SELECT id, date, memo, temp, weather, image_uri
     FROM diary_entries
     WHERE date = ?`,
    date,
  );

  return row ? mapDiaryRow(row) : undefined;
}

export async function saveDiaryItem(item: DiaryItem): Promise<void> {
  const db = await getDatabase();

  await upsertDiaryItem(item, db);
}

export async function seedSampleDiaryItems(): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const item of getSampleDiaryItems()) {
      await db.runAsync(
        `INSERT OR IGNORE INTO diary_entries
          (id, date, memo, temp, weather, image_uri, updated_at)
         VALUES ($id, $date, $memo, $temp, $weather, $image, datetime('now'))`,
        {
          $id: item.id,
          $date: item.date,
          $memo: item.memo,
          $temp: item.temp ?? null,
          $weather: item.weather ?? null,
          $image: item.image ?? null,
        },
      );
    }
  });
}

async function upsertDiaryItem(
  item: DiaryItem,
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO diary_entries (id, date, memo, temp, weather, image_uri, updated_at)
     VALUES ($id, $date, $memo, $temp, $weather, $image, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET
       id = excluded.id,
       memo = excluded.memo,
       temp = excluded.temp,
       weather = excluded.weather,
       image_uri = excluded.image_uri,
       updated_at = datetime('now')`,
    {
      $id: item.id,
      $date: item.date,
      $memo: item.memo,
      $temp: item.temp ?? null,
      $weather: item.weather ?? null,
      $image: item.image ?? null,
    },
  );
}
