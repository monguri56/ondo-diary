export const Colors = {
  light: {
    text: "#11181C",
    background: "#FFFFFF",
    tint: "#0A7EA4",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#0A7EA4",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#FFFFFF",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#FFFFFF",
  },
};

export const Fonts = {
  rounded: "System",
  mono: "SpaceMono",
};

export function getTimeTheme() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return {
      timeLabel: "아침",
      backgroundColor: "#FEF3C7",
      cardColor: "#FFFBEB",
      textColor: "#78350F",
      subTextColor: "#92400E",
      emoji: "🌅",
    };
  }

  if (hour >= 11 && hour < 17) {
    return {
      timeLabel: "낮",
      backgroundColor: "#E0F2FE",
      cardColor: "#F0F9FF",
      textColor: "#0F172A",
      subTextColor: "#0369A1",
      emoji: "☀️",
    };
  }

  if (hour >= 17 && hour < 20) {
    return {
      timeLabel: "저녁",
      backgroundColor: "#FED7AA",
      cardColor: "#FFF7ED",
      textColor: "#7C2D12",
      subTextColor: "#9A3412",
      emoji: "🌇",
    };
  }

  return {
    timeLabel: "밤",
    backgroundColor: "#0F172A",
    cardColor: "#1E293B",
    textColor: "#F8FAFC",
    subTextColor: "#CBD5E1",
    emoji: "🌙",
  };
}

export function getWeatherTheme(weatherMain?: string) {
  switch (weatherMain) {
    case "Rain":
    case "Drizzle":
    case "Thunderstorm":
      return {
        weatherLabel: "비",
        emoji: "🌧️",
        backgroundColor: "#475569",
        cardColor: "#64748B",
        textColor: "#F8FAFC",
        subTextColor: "#E2E8F0",
      };

    case "Snow":
      return {
        weatherLabel: "눈",
        emoji: "❄️",
        backgroundColor: "#E0F2FE",
        cardColor: "#F8FAFC",
        textColor: "#0F172A",
        subTextColor: "#0369A1",
      };

    case "Clouds":
      return {
        weatherLabel: "흐림",
        emoji: "☁️",
        backgroundColor: "#CBD5E1",
        cardColor: "#F1F5F9",
        textColor: "#0F172A",
        subTextColor: "#475569",
      };

    case "Clear":
      return null;

    default:
      return null;
  }
}
