import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function safeFileName(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return normalized.length > 0 ? normalized : 'promptia-prompt';
}

export async function sharePromptText(text: string, title = 'Promptia Prompt'): Promise<void> {
  const payload = text.trim();

  if (!payload) {
    return;
  }

  const canShareFiles = await Sharing.isAvailableAsync();

  if (canShareFiles) {
    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

    if (baseDir) {
      const uri = `${baseDir}${safeFileName(title)}.txt`;
      await FileSystem.writeAsStringAsync(uri, payload, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, {
        dialogTitle: title,
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
      });
      return;
    }
  }

  await Share.share({ title, message: payload });
}
