export type WeatherGradient = [string, string, ...string[]];

export const weatherCodeMap: Record<number, string> = {
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

export function getWeatherGradient(
  temp?: number,
  weather?: string,
  hour = new Date().getHours(),
): WeatherGradient {
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
