import * as SecureStore from "expo-secure-store";

const chunkSize = 1800;
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

function countKey(key: string) { return `${key}.chunks`; }
function chunkKey(key: string, index: number) { return `${key}.${index}`; }

export const secureSessionStorage = {
  async getItem(key: string) {
    const countValue = await SecureStore.getItemAsync(countKey(key), options);
    if (!countValue) return null;
    const count = Number(countValue);
    if (!Number.isInteger(count) || count < 1 || count > 32) { await this.removeItem(key); return null; }
    const chunks = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index), options)));
    return chunks.some((part) => part === null) ? null : chunks.join("");
  },
  async setItem(key: string, value: string) {
    const previous = Number(await SecureStore.getItemAsync(countKey(key), options) ?? 0);
    const chunks = value.match(new RegExp(`.{1,${chunkSize}}`, "gs")) ?? [];
    await Promise.all(chunks.map((part, index) => SecureStore.setItemAsync(chunkKey(key, index), part, options)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length), options);
    if (previous > chunks.length) await Promise.all(Array.from({ length: previous - chunks.length }, (_, offset) => SecureStore.deleteItemAsync(chunkKey(key, chunks.length + offset), options)));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(countKey(key), options) ?? 0);
    await Promise.all(Array.from({ length: Math.max(0, Math.min(count, 32)) }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index), options)));
    await SecureStore.deleteItemAsync(countKey(key), options);
  },
};

export async function clearUserScopedCache() {
  await SecureStore.deleteItemAsync("stheno.user-cache", options);
}
