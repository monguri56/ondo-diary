import * as Location from "expo-location";

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("위치 권한이 거부되었습니다.");
  }

  const location = await Location.getCurrentPositionAsync({});
  return location.coords;
}
