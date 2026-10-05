/**
 * 客户端全局事件缓存服务 (Client-Side Events Cache)
 * 允许在 Dashboard 与 Events 页面间实现 0ms 瞬间共享，消除跨页跳转网络等待
 */

export interface EventItem {
  id: string;
  name: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  points: number;
}

let inMemoryEvents: EventItem[] | null = null;

export function getCachedEvents(): EventItem[] | null {
  if (inMemoryEvents && inMemoryEvents.length > 0) {
    return inMemoryEvents;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("jbs_events_cache");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryEvents = parsed;
          return inMemoryEvents;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return null;
}

export function setCachedEvents(events: EventItem[]): void {
  if (!Array.isArray(events)) return;
  inMemoryEvents = events;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("jbs_events_cache", JSON.stringify(events));
    } catch {
      // ignore storage errors
    }
  }
}

export interface RewardItem {
  id: string;
  name: string;
  pointsRequired: number;
  image: string | null;
  description: string | null;
  stock: number;
}

let inMemoryRewards: RewardItem[] | null = null;

export function getCachedRewards(): RewardItem[] | null {
  if (inMemoryRewards && inMemoryRewards.length > 0) {
    return inMemoryRewards;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("jbs_rewards_cache");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryRewards = parsed;
          return inMemoryRewards;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return null;
}

export function setCachedRewards(rewards: RewardItem[]): void {
  if (!Array.isArray(rewards)) return;
  inMemoryRewards = rewards;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("jbs_rewards_cache", JSON.stringify(rewards));
    } catch {
      // ignore storage errors
    }
  }
}
