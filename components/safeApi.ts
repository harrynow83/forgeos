export async function safeApi(path: string, options?: RequestInit) {
  try {
    const res = await fetch(path, options);
    const data = await res.json();

    if (!res.ok) throw new Error();

    return data;
  } catch {
    return { success: false, error: true };
  }
}
