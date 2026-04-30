const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export async function getCurrentWeather(latitude: number, longitude: number) {
  if (!API_KEY) {
    throw new Error("날씨 API 키가 설정되어 있지 않습니다.");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("날씨 정보를 불러오지 못했습니다.");
  }

  return res.json();
}

export function isPublicWeatherApiKeyConfigured() {
  return Boolean(API_KEY);
}
