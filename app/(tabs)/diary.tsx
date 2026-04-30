import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ArrowLeft, Home } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  DiaryItem,
  getDiaryItems,
  saveDiaryItem,
  seedSampleDiaryItems,
} from "@/lib/diary-db";
import { persistDiaryImage } from "@/lib/image-files";
import {
  getWeatherGradient as getLiveWeatherGradient,
  weatherCodeMap,
} from "@/lib/weather-gradient";

type ViewMode = "year" | "month" | "week";

const COLORS = {
  bg: "#FFF7ED",
  card: "rgba(255,255,255,0.18)",
  cardStrong: "rgba(255,255,255,0.28)",
  primary: "#111111",
  secondary: "#2A2A2A",
  text: "#2F2A25",
  subText: "#8A7A6C",
  white: "#FFFFFF",
  whiteSoft: "rgba(255,255,255,0.78)",
  border: "rgba(255,255,255,0.42)",
  pale: "rgba(255,247,237,0.72)",
};

const weatherMap: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "이슬비",
  53: "이슬비",
  55: "이슬비",
  61: "비",
  63: "비",
  65: "강한 비",
  71: "눈",
  73: "눈",
  75: "강한 눈",
  80: "소나기",
  81: "소나기",
  82: "강한 소나기",
  95: "천둥번개",
};

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  const startBlank = firstDay.getDay();

  for (let i = 0; i < startBlank; i++) {
    dates.push(new Date(year, month, i - startBlank + 1));
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }

  while (dates.length % 7 !== 0) {
    const last = dates[dates.length - 1];
    dates.push(
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
    );
  }

  return dates;
}

function getWeekDates(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, month) => ({
    month,
    label: `${month + 1}월`,
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
  }));
}

function getDiaryGradient(
  temp?: number,
  weather?: string,
  hour = new Date().getHours(),
): [string, string, ...string[]] {
  const isMorning = hour >= 5 && hour < 11;
  const isDay = hour >= 11 && hour < 17;
  const isEvening = hour >= 17 && hour < 20;
  const isNight = hour >= 20 || hour < 5;

  const isRain = weather?.includes("비") || weather?.includes("소나기");
  const isSnow = weather?.includes("눈");
  const isCloud = weather?.includes("흐림") || weather?.includes("구름");
  const isFog = weather?.includes("안개");
  const isThunder = weather?.includes("천둥");

  if (isThunder) return ["#050505", "#202020"];
  if (isRain && isNight) return ["#050505", "#131A20", "#24313A"];
  if (isRain) return ["#111111", "#28313B"];
  if (isSnow) return ["#202020", "#68717A"];
  if (isFog) return ["#1C1C1C", "#6F7782"];

  if (isNight) return ["#050505", "#202020"];
  if (isEvening) return ["#101010", isCloud ? "#303846" : "#3A302B"];

  if (temp !== undefined) {
    if (temp >= 25) return ["#111111", "#332B28"];
    if (temp >= 20) return ["#151515", "#39465A"];
    if (temp >= 15) return ["#17202A", "#526273"];
    if (temp >= 8) return ["#101820", "#356078"];

    return ["#0B1118", "#4C6575"];
  }

  if (isMorning || isDay) return ["#141414", "#3D4B59"];

  return ["#111111", "#2A2A2A"];
}

export default function DiaryScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDate(today), [today]);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [memo, setMemo] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [temp, setTemp] = useState<number | undefined>();
  const [weather, setWeather] = useState<string | undefined>();
  const [backdropTemp, setBackdropTemp] = useState<number | undefined>();
  const [backdropWeather, setBackdropWeather] = useState<string | undefined>();
  const [loadingWeather, setLoadingWeather] = useState(false);

  const selectedDiary = diaries.find((item) => item.date === selectedDate);
  const isSelectedToday = selectedDate === todayKey;
  const currentHour = new Date().getHours();
  const gradient = getLiveWeatherGradient(
    backdropTemp,
    backdropWeather,
    currentHour,
  );

  const diaryMap = useMemo(() => {
    return diaries.reduce<Record<string, DiaryItem>>((acc, item) => {
      acc[item.date] = item;
      return acc;
    }, {});
  }, [diaries]);

  const loadDiaries = useCallback(async () => {
    await seedSampleDiaryItems();
    setDiaries(await getDiaryItems());
  }, []);

  const fetchCurrentBackdropWeather = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      );
      const data = await res.json();

      setBackdropTemp(Math.round(data.current.temperature_2m));
      setBackdropWeather(weatherCodeMap[data.current.weather_code] ?? "날씨 정보");
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchWeather = useCallback(
    async (targetDate = todayKey) => {
      try {
        setLoadingWeather(true);

        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          setTemp(undefined);
          setWeather("위치 권한 필요");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${targetDate}&end_date=${targetDate}`,
        );
        const data = await res.json();
        const maxTemp = data.daily.temperature_2m_max[0];
        const minTemp = data.daily.temperature_2m_min[0];
        const weatherCode = data.daily.weather_code[0];

        setTemp(Math.round((maxTemp + minTemp) / 2));
        setWeather(weatherCodeMap[weatherCode] ?? "날씨 정보");
      } catch (error) {
        console.log(error);
        setWeather("날씨 불러오기 실패");
      } finally {
        setLoadingWeather(false);
      }
    },
    [todayKey],
  );

  useEffect(() => {
    loadDiaries();
    fetchCurrentBackdropWeather();
    fetchWeather(todayKey);
  }, [fetchCurrentBackdropWeather, fetchWeather, loadDiaries, todayKey]);

  useEffect(() => {
    if (selectedDiary) {
      setMemo(selectedDiary.memo ?? "");
      setImage(selectedDiary.image);
      setTemp(selectedDiary.temp);
      setWeather(selectedDiary.weather);
      return;
    }

    setMemo("");
    setImage(undefined);
    setTemp(undefined);
    setWeather(undefined);

    if (selectedDate === todayKey) {
      fetchWeather(todayKey);
    }
  }, [fetchWeather, selectedDate, selectedDiary, todayKey]);

  const pickImage = async () => {
    if (!isSelectedToday) {
      Alert.alert("오늘만 작성할 수 있어요", "지난 기록은 확인만 가능해요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!isSelectedToday) {
      Alert.alert("오늘만 작성할 수 있어요", "지난 기록은 확인만 가능해요.");
      return;
    }

    if (!memo.trim() && !image) {
      Alert.alert("기록할 내용이 없어요", "사진이나 메모를 추가해주세요.");
      return;
    }

    try {
      const diaryId = selectedDiary?.id ?? Date.now().toString();
      const persistedImage = image
        ? await persistDiaryImage(image, diaryId)
        : undefined;
      const newDiary: DiaryItem = {
        id: diaryId,
        date: selectedDate,
        memo,
        image: persistedImage,
        temp,
        weather,
      };
      const filtered = diaries.filter((item) => item.date !== selectedDate);

      await saveDiaryItem(newDiary);
      setImage(persistedImage);
      setDiaries([newDiary, ...filtered]);
      Alert.alert("저장 완료", "온도일기가 저장됐어요.");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "저장 실패",
        "사진이나 기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  const changePeriod = (direction: "prev" | "next") => {
    const next = new Date(currentDate);

    if (viewMode === "year") {
      next.setFullYear(
        currentDate.getFullYear() + (direction === "next" ? 1 : -1),
      );
    }

    if (viewMode === "month") {
      next.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    if (viewMode === "week") {
      next.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    }

    setCurrentDate(next);
  };

  const renderCalendarTitle = () => {
    if (viewMode === "year") return `${currentDate.getFullYear()}년`;
    if (viewMode === "month") {
      return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    }
    return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 주간`;
  };

  const renderDateCell = (date: Date) => {
    const dateKey = formatDate(date);
    const diary = diaryMap[dateKey];
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;
    const isDisabled = (!isToday && !diary) || isFuture;
    const isSelected = selectedDate === dateKey;
    const isOtherMonth = date.getMonth() !== currentDate.getMonth();

    return (
      <Pressable
        key={dateKey}
        disabled={isDisabled}
        style={[
          styles.dateCell,
          isSelected && styles.selectedDateCell,
          isOtherMonth && viewMode === "month" && styles.otherMonthCell,
          isDisabled && styles.disabledDateCell,
          isToday && styles.todayCell,
        ]}
        onPress={() => {
          if (!isDisabled) {
            setSelectedDate(dateKey);
          }
        }}
      >
        <Text
          style={[
            styles.dateText,
            isSelected && styles.selectedDateText,
            isDisabled && styles.disabledDateText,
            isToday && styles.todayText,
          ]}
        >
          {date.getDate()}
        </Text>

        {diary?.image ? (
          <Image source={{ uri: diary.image }} style={styles.calendarImage} />
        ) : diary ? (
          <View style={styles.memoDot} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>온도일기</Text>
          <Text style={styles.desc}>오늘의 온도를 캘린더에 기록해요</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
          style={styles.headerButton}
          onPress={() => router.push("/")}
        >
          <ArrowLeft size={17} color="#FFFFFF" strokeWidth={2.6} />
          <Home size={18} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.headerButtonText}>홈</Text>
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {(["year", "month", "week"] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.modeButton,
              viewMode === mode && styles.activeModeButton,
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.modeText,
                viewMode === mode && styles.activeModeText,
              ]}
            >
              {mode === "year" ? "연간" : mode === "month" ? "월간" : "주간"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => changePeriod("prev")}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.calendarTitle}>{renderCalendarTitle()}</Text>
          <Pressable onPress={() => changePeriod("next")}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        {viewMode === "year" ? (
          <View style={styles.yearGrid}>
            {getYearMonths(currentDate.getFullYear()).map((item) => {
              const count = diaries.filter((diary) =>
                diary.date.startsWith(item.key),
              ).length;

              return (
                <Pressable
                  key={item.month}
                  style={styles.monthBox}
                  onPress={() => {
                    setCurrentDate(
                      new Date(currentDate.getFullYear(), item.month, 1),
                    );
                    setViewMode("month");
                  }}
                >
                  <Text style={styles.monthText}>{item.label}</Text>
                  <Text style={styles.monthCount}>{count}개 기록</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <>
            <View style={styles.weekLabelRow}>
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <Text key={day} style={styles.weekLabel}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {(viewMode === "month"
                ? getMonthDates(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                  )
                : getWeekDates(currentDate)
              ).map(renderDateCell)}
            </View>
          </>
        )}
      </View>

      <View style={styles.recordSection}>
        <View style={styles.recordHeader}>
          <Text style={styles.sectionTitle}>{selectedDate} 기록</Text>
          {!isSelectedToday && (
            <Text style={styles.readOnlyBadge}>읽기 전용</Text>
          )}
        </View>

        <View style={styles.weatherBox}>
          <Text style={styles.weatherText}>
            {loadingWeather
              ? "날씨 불러오는 중..."
              : `${temp ?? "-"}℃ · ${weather ?? "-"}`}
          </Text>
          {isSelectedToday && (
            <Pressable onPress={() => fetchWeather(todayKey)}>
              <Text style={styles.refreshText}>새로고침</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imageText}>
              {isSelectedToday ? "+ 사진 등록하기" : "저장된 사진이 없어요"}
            </Text>
          )}
        </Pressable>

        <TextInput
          style={[styles.memoInput, !isSelectedToday && styles.disabledInput]}
          placeholder="오늘의 옷차림, 하늘, 기분을 기록해보세요."
          placeholderTextColor={COLORS.subText}
          value={memo}
          onChangeText={setMemo}
          multiline
          editable={isSelectedToday}
        />

        {isSelectedToday && (
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장하기</Text>
          </Pressable>
        )}
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  topBar: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  logo: {
    fontSize: 30,
    fontWeight: "500",
    color: COLORS.white,
  },
  desc: {
    marginTop: 6,
    color: COLORS.whiteSoft,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  headerButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: 5,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  activeModeButton: {
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modeText: {
    color: COLORS.whiteSoft,
    fontWeight: "400",
  },
  activeModeText: {
    color: COLORS.white,
  },
  card: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  recordSection: {
    marginTop: 18,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    fontSize: 34,
    color: COLORS.white,
    fontWeight: "400",
    paddingHorizontal: 8,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: COLORS.white,
  },
  weekLabelRow: {
    flexDirection: "row",
    marginTop: 18,
    marginBottom: 8,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: COLORS.whiteSoft,
    fontWeight: "400",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCell: {
    width: `${100 / 7}%`,
    height: 62,
    padding: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 14,
  },
  selectedDateCell: {
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  todayCell: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.72)",
  },
  otherMonthCell: {
    opacity: 0.35,
  },
  disabledDateCell: {
    opacity: 0.25,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "400",
    color: COLORS.white,
    marginBottom: 4,
  },
  selectedDateText: {
    color: COLORS.white,
  },
  todayText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  disabledDateText: {
    color: "rgba(255,255,255,0.72)",
  },
  calendarImage: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
  },
  memoDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  monthBox: {
    width: "30.8%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.white,
  },
  monthCount: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.whiteSoft,
    fontWeight: "400",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.white,
    marginBottom: 14,
  },
  readOnlyBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    color: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 14,
    overflow: "hidden",
  },
  weatherBox: {
    backgroundColor: COLORS.cardStrong,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  weatherText: {
    color: COLORS.white,
    fontWeight: "400",
  },
  refreshText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  imageBox: {
    height: 210,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
  },
  imageText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  memoInput: {
    minHeight: 130,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    borderRadius: 18,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    textAlignVertical: "top",
  },
  disabledInput: {
    opacity: 0.75,
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "500",
    fontSize: 16,
  },
});
