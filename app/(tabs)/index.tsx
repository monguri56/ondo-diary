import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DiaryItem, getDiaryItems, seedSampleDiaryItems } from "@/lib/diary-db";
import {
  getWeatherGradient as getLiveWeatherGradient,
  weatherCodeMap,
} from "@/lib/weather-gradient";

const COLORS = {
  card: "rgba(255,255,255,0.18)",
  cardStrong: "rgba(255,255,255,0.28)",
  primary: "#F97316",
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

function getTodayKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

function formatKoreanDate(dateString: string) {
  const date = new Date(dateString);

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getTimeLabel(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return "아침";
  if (hour >= 11 && hour < 17) return "낮";
  if (hour >= 17 && hour < 20) return "저녁";
  return "밤";
}

function getWeatherGradient(
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

  if (isNight) {
    return ["#050505", "#202020"];
  }

  if (isEvening) {
    return ["#101010", isCloud ? "#303846" : "#3A302B"];
  }

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

function getOutfitLabel(temp?: number, weather?: string) {
  if (weather?.includes("비") || weather?.includes("소나기")) {
    return "우산 챙기고, 젖어도 부담 없는 신발 추천";
  }

  if (weather?.includes("눈")) {
    return "미끄럼 조심! 따뜻한 아우터와 방한템 추천";
  }

  if (temp === undefined) return "날씨를 불러오면 옷차림을 추천해줄게요";

  if (temp >= 28) return "민소매, 반팔, 얇은 셔츠 추천";
  if (temp >= 23) return "반팔, 얇은 긴팔, 면바지 추천";
  if (temp >= 20) return "얇은 가디건, 긴팔, 청바지 추천";
  if (temp >= 17) return "가디건, 맨투맨, 후드 추천";
  if (temp >= 12) return "자켓, 니트, 트렌치코트 추천";
  if (temp >= 9) return "코트, 가죽자켓, 두꺼운 니트 추천";
  if (temp >= 5) return "패딩, 두꺼운 코트, 목도리 추천";

  return "롱패딩, 장갑, 목도리 필수";
}

function getDisplayTemp(currentTemp?: number, todayDiary?: DiaryItem) {
  return currentTemp ?? todayDiary?.temp;
}

async function createWatermarkedImage(
  imageUri: string,
  temperatureText: string,
) {
  const image = document.createElement("img");
  image.crossOrigin = "anonymous";
  image.src = imageUri;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지를 만들 수 없어요.");
  }

  context.drawImage(image, 0, 0);

  const padding = Math.max(32, canvas.width * 0.04);
  const fontSize = Math.max(48, canvas.width * 0.09);
  context.font = `300 ${fontSize}px "Avenir Next", "Helvetica Neue", Arial, sans-serif`;
  context.textBaseline = "top";

  const metrics = context.measureText(temperatureText);
  const boxWidth = metrics.width + padding * 1.35;
  const boxHeight = fontSize + padding * 0.78;
  const radius = Math.max(24, canvas.width * 0.035);
  const x = padding;
  const y = canvas.height - padding - boxHeight;

  context.shadowColor = "rgba(0,0,0,0.32)";
  context.shadowBlur = padding * 0.7;
  context.shadowOffsetY = padding * 0.18;
  context.fillStyle = "rgba(0,0,0,0.48)";
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + boxWidth - radius, y);
  context.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
  context.lineTo(x + boxWidth, y + boxHeight - radius);
  context.quadraticCurveTo(
    x + boxWidth,
    y + boxHeight,
    x + boxWidth - radius,
    y + boxHeight,
  );
  context.lineTo(x + radius, y + boxHeight);
  context.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.fill();

  context.shadowColor = "transparent";
  context.strokeStyle = "rgba(255,255,255,0.22)";
  context.lineWidth = Math.max(1, canvas.width * 0.002);
  context.stroke();

  context.fillStyle = "#FFFFFF";
  context.shadowColor = "rgba(0,0,0,0.28)";
  context.shadowBlur = padding * 0.18;
  context.fillText(temperatureText, x + padding * 0.58, y + padding * 0.34);

  return canvas.toDataURL("image/png");
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [metadata, data] = dataUrl.split(",");
  const mime = metadata.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
}

export default function HomeScreen() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [currentTemp, setCurrentTemp] = useState<number | undefined>();
  const [currentWeather, setCurrentWeather] = useState<string | undefined>();
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [recommendScroll, setRecommendScroll] = useState({
    content: 1,
    viewport: 1,
    x: 0,
  });

  const currentHour = new Date().getHours();
  const todayDiary = useMemo(() => {
    return diaries.find((diary) => diary.date === getTodayKey());
  }, [diaries]);
  const displayTemp = getDisplayTemp(currentTemp, todayDiary);
  const displayWeather = currentWeather ?? todayDiary?.weather;
  const temperatureText =
    displayTemp === undefined ? "-℃" : `${Math.round(displayTemp)}℃`;
  const gradient = getLiveWeatherGradient(displayTemp, displayWeather, currentHour);

  const loadDiaries = useCallback(async () => {
    await seedSampleDiaryItems();
    setDiaries(await getDiaryItems());
  }, []);

  const fetchCurrentWeather = useCallback(async () => {
    try {
      setLoadingWeather(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setCurrentTemp(undefined);
        setCurrentWeather("위치 권한 필요");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      );

      const data = await res.json();

      setCurrentTemp(Math.round(data.current.temperature_2m));
      setCurrentWeather(weatherCodeMap[data.current.weather_code] ?? "날씨 정보");
    } catch (error) {
      console.log(error);
      setCurrentTemp(undefined);
      setCurrentWeather("날씨 불러오기 실패");
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    loadDiaries();
    fetchCurrentWeather();
  }, [fetchCurrentWeather, loadDiaries]);

  const recommendedDiaries = useMemo(() => {
    if (displayTemp === undefined) return [];

    return diaries
      .filter((diary) => {
        if (diary.temp === undefined || diary.date === getTodayKey()) {
          return false;
        }

        return Math.abs(diary.temp - displayTemp) <= 3;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [diaries, displayTemp]);

  const recommendThumb = useMemo(() => {
    if (recommendScroll.content <= recommendScroll.viewport) {
      return { left: 0, width: 1 };
    }

    const width = Math.max(
      0.22,
      recommendScroll.viewport / recommendScroll.content,
    );
    const maxScroll = recommendScroll.content - recommendScroll.viewport;
    const left = Math.min(
      1 - width,
      (recommendScroll.x / maxScroll) * (1 - width),
    );

    return { left, width };
  }, [recommendScroll]);

  const handleRecommendScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setRecommendScroll((current) => ({
        ...current,
        x: event.nativeEvent.contentOffset.x,
      }));
    },
    [],
  );

  const handleShareToday = useCallback(async () => {
    if (!todayDiary?.image) {
      Alert.alert("공유할 이미지가 없어요", "오늘 기록에 이미지가 필요해요.");
      return;
    }

    if (Platform.OS !== "web") {
      Alert.alert("웹에서 먼저 지원해요", "현재 공유 워터마크는 웹에서 동작해요.");
      return;
    }

    try {
      setSharing(true);
      const dataUrl = await createWatermarkedImage(
        todayDiary.image,
        temperatureText,
      );
      const file = dataUrlToFile(dataUrl, "ondo-diary.png");
      const webNavigator = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };

      if (
        webNavigator.share &&
        (!webNavigator.canShare || webNavigator.canShare({ files: [file] }))
      ) {
        await webNavigator.share({
          files: [file],
          title: "온도일기",
          text: `${temperatureText}의 오늘 기록`,
        });
        return;
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "ondo-diary.png";
      link.click();
    } catch (error) {
      console.log(error);
      Alert.alert("공유 실패", "이미지에 온도 워터마크를 넣지 못했어요.");
    } finally {
      setSharing(false);
    }
  }, [temperatureText, todayDiary]);

  return (
    <LinearGradient colors={gradient} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>온도일기</Text>
            <Text style={styles.desc}>날씨와 옷차림을 사진으로 남겨요</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="기록으로 이동"
            style={styles.headerButton}
            onPress={() => router.push("/diary")}
          >
            <CalendarDays size={19} color={COLORS.white} strokeWidth={2.4} />
            <Text style={styles.headerButtonText}>기록</Text>
          </Pressable>
        </View>

        <View style={styles.todaySection}>
          <View style={styles.weatherSummary}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryTemperature}>{temperatureText}</Text>
              <Text style={styles.cardLabel}>
                {getTimeLabel(currentHour)} · {displayWeather ?? "-"}
              </Text>
            </View>
            {loadingWeather ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>날씨 불러오는 중...</Text>
              </View>
            ) : (
              <Text style={styles.outfitGuide}>
                {getOutfitLabel(displayTemp, displayWeather)}
              </Text>
            )}

            <Pressable
              style={styles.refreshButton}
              onPress={fetchCurrentWeather}
            >
              <Text style={styles.refreshText}>날씨 새로고침</Text>
            </Pressable>
          </View>

          <View style={styles.imageSet}>
            <View style={styles.imageStage}>
              {todayDiary?.image ? (
                <Image source={{ uri: todayDiary.image }} style={styles.todayImage} />
              ) : (
                <View style={styles.emptyImageStage}>
                  <Text style={styles.emptyImageTitle}>이미지 업로드</Text>
                  <Text style={styles.emptyImageDesc}>
                    기록 탭에서 오늘의 사진을 추가해보세요.
                  </Text>
                </View>
              )}

              <View style={styles.imageTemperatureBadge}>
                <Text style={styles.imageTemperatureText}>{temperatureText}</Text>
              </View>
            </View>

            {todayDiary ? (
              <Text style={styles.diaryMemo}>{todayDiary.memo}</Text>
            ) : (
              <Text style={styles.diaryMemo}>
                오늘 기록이 아직 없어요. 기록 탭에서 사진과 메모를 남겨보세요.
              </Text>
            )}

            <Pressable
              style={[styles.shareButton, sharing && styles.disabledButton]}
              disabled={sharing}
              onPress={handleShareToday}
            >
              <Text style={styles.shareText}>
                {sharing ? "공유 준비 중" : "공유하기"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>비슷한 온도의 기록</Text>
          <Text style={styles.sectionSub}>±3℃ 기준</Text>
        </View>

        {recommendedDiaries.length > 0 ? (
          <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recommendScroller}
            contentContainerStyle={styles.horizontalList}
            scrollEventThrottle={16}
            onScroll={handleRecommendScroll}
            onLayout={(event) =>
              setRecommendScroll((current) => ({
                ...current,
                viewport: event.nativeEvent.layout.width,
              }))
            }
            onContentSizeChange={(width) =>
              setRecommendScroll((current) => ({
                ...current,
                content: width,
              }))
            }
          >
            {recommendedDiaries.map((diary) => (
              <View key={diary.id} style={styles.recommendCard}>
                {diary.image ? (
                  <Image
                    source={{ uri: diary.image }}
                    style={styles.recommendImage}
                  />
                ) : (
                  <View style={styles.noImageBox}>
                    <Text style={styles.noImageText}>사진 없음</Text>
                  </View>
                )}

                <Text style={styles.recommendDate}>
                  {formatKoreanDate(diary.date)}
                </Text>
                <Text style={styles.recommendMeta}>
                  {diary.temp ?? "-"}℃ · {diary.weather ?? "-"}
                </Text>
                <Text style={styles.recommendMemo} numberOfLines={2}>
                  {diary.memo}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.customScrollTrack}>
            <View
              style={[
                styles.customScrollThumb,
                {
                  marginLeft: `${recommendThumb.left * 100}%`,
                  width: `${recommendThumb.width * 100}%`,
                },
              ]}
            />
          </View>
          </>
        ) : (
          <View style={styles.emptyRecommendCard}>
            <Text style={styles.emptyRecommendTitle}>
              아직 추천할 기록이 없어요
            </Text>
            <Text style={styles.emptyRecommendDesc}>
              며칠 더 기록하면 비슷한 온도에 입었던 옷을 추천할 수 있어요.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
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
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },
  todaySection: {
    marginTop: 22,
  },
  weatherSummary: {
    backgroundColor: COLORS.cardStrong,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryTemperature: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: "500",
    lineHeight: 46,
  },
  cardLabel: {
    flexShrink: 1,
    marginTop: 6,
    color: COLORS.whiteSoft,
    fontSize: 14,
    fontWeight: "400",
    textAlign: "right",
  },
  outfitGuide: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 24,
  },
  imageSet: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  imageStage: {
    height: 360,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  todayImage: {
    width: "100%",
    height: "100%",
  },
  emptyImageStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyImageTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "400",
  },
  emptyImageDesc: {
    marginTop: 8,
    color: COLORS.whiteSoft,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  imageTemperatureBadge: {
    position: "absolute",
    top: 18,
    left: 18,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },
  imageTemperatureText: {
    color: COLORS.white,
    fontFamily: Platform.select({
      web: '"Avenir Next", "Helvetica Neue", Arial, sans-serif',
      ios: "Avenir Next",
      default: "sans-serif",
    }),
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 38,
    letterSpacing: 0,
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  diaryMemo: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    paddingHorizontal: 4,
  },
  loadingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: COLORS.white,
    fontWeight: "400",
  },
  refreshButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.24)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  refreshText: {
    color: COLORS.white,
    fontWeight: "400",
  },
  shareButton: {
    alignSelf: "stretch",
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
  },
  shareText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.58,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "500",
    color: COLORS.white,
  },
  sectionSub: {
    color: COLORS.white,
    fontWeight: "400",
    fontSize: 13,
  },
  recommendScroller: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "visible",
  },
  horizontalList: {
    columnGap: 12,
    paddingRight: 24,
    paddingBottom: 8,
  },
  customScrollTrack: {
    height: 5,
    marginTop: 10,
    marginHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  customScrollThumb: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  recommendCard: {
    width: 180,
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  recommendImage: {
    width: "100%",
    height: 140,
    borderRadius: 18,
    marginBottom: 10,
  },
  noImageBox: {
    width: "100%",
    height: 140,
    borderRadius: 18,
    backgroundColor: COLORS.pale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  noImageText: {
    color: COLORS.white,
    fontWeight: "400",
  },
  recommendDate: {
    color: COLORS.white,
    fontWeight: "400",
    fontSize: 14,
  },
  recommendMeta: {
    marginTop: 5,
    color: COLORS.white,
    fontWeight: "400",
    fontSize: 13,
  },
  recommendMemo: {
    marginTop: 6,
    color: COLORS.whiteSoft,
    lineHeight: 19,
    fontSize: 13,
    fontWeight: "400",
  },
  emptyRecommendCard: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  emptyRecommendTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "400",
  },
  emptyRecommendDesc: {
    marginTop: 8,
    color: COLORS.whiteSoft,
    lineHeight: 21,
    fontWeight: "400",
  },
});
