import * as FileSystem from "expo-file-system/legacy";

const IMAGE_DIR = `${FileSystem.documentDirectory ?? ""}diary-images/`;

function getExtension(uri: string) {
  const cleanUri = uri.split("?")[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);

  return match?.[1]?.toLowerCase() ?? "jpg";
}

export async function persistDiaryImage(uri: string, diaryId: string) {
  if (!FileSystem.documentDirectory || uri.startsWith(IMAGE_DIR)) {
    return uri;
  }

  const directory = await FileSystem.getInfoAsync(IMAGE_DIR);

  if (!directory.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }

  const targetUri = `${IMAGE_DIR}${diaryId}-${Date.now()}.${getExtension(uri)}`;

  await FileSystem.copyAsync({
    from: uri,
    to: targetUri,
  });

  return targetUri;
}
