// Simple deterministic daily post selection utility
export function getDailyPosts(dayKey: string, allSeeds: any[]): any[] {
  // Create a simple hash from the day key
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = ((hash << 5) - hash + dayKey.charCodeAt(i)) & 0xffffffff;
  }

  // Use the hash to deterministically select and order posts
  const shuffled = [...allSeeds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) & 0xffffffff;
    const j = Math.abs(hash) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 10);
}