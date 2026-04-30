import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWeatherGradient, weatherCodeMap, WeatherGradient } from '@/lib/weather-gradient';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [weatherLoadingDone, setWeatherLoadingDone] = useState(false);
  const [loadingGradient, setLoadingGradient] = useState<WeatherGradient>(
    getWeatherGradient(undefined, undefined),
  );
  const showLoading = !minLoadingDone || !weatherLoadingDone;

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingDone(true), 900);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentWeatherGradient() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
        );
        const data = await res.json();
        const currentTemp = Math.round(data.current.temperature_2m);
        const currentWeather = weatherCodeMap[data.current.weather_code] ?? '날씨 정보';

        if (mounted) {
          setLoadingGradient(getWeatherGradient(currentTemp, currentWeather));
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) {
          setWeatherLoadingDone(true);
        }
      }
    }

    loadCurrentWeatherGradient();

    return () => {
      mounted = false;
    };
  }, []);

  if (showLoading) {
    return (
      <LinearGradient colors={loadingGradient} style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingTitle}>온도일기</Text>
          <Text style={styles.loadingSubtitle}>오늘의 온도를 기록하는 중</Text>
        </View>
        <View style={styles.loadingTrack}>
          <View style={styles.loadingBar} />
        </View>
        <StatusBar style="light" />
      </LinearGradient>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingMark: {
    alignItems: 'center',
  },
  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 0,
  },
  loadingSubtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 14,
    fontWeight: '300',
  },
  loadingTrack: {
    width: 124,
    height: 3,
    marginTop: 28,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  loadingBar: {
    width: '58%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
});
