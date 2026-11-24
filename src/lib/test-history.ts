import { createStore } from "@/storage/store";
import { STORAGE_KEYS } from "@/storage/registry";
import {
  computeImprovementDelta,
  isSessionRecord,
  type DailyImprovementDelta,
  type HotSeatSessionRecord,
  type NewSessionRecord,
} from "@/domain/improvement";

export type { DailyImprovementDelta, HotSeatSessionRecord };

const historyStore = createStore<HotSeatSessionRecord[]>({
  key: STORAGE_KEYS.testHistory,
  version: 1,
  fallback: () => [],
  migrate: (data) => (Array.isArray(data) ? data.filter(isSessionRecord) : []),
});

export const subscribeTestHistory = historyStore.subscribe;
export const getTestHistorySnapshot = historyStore.get;
export const getTestHistoryServerSnapshot = historyStore.getServerSnapshot;

/** Appends a capture session to history, computing its improvement over the previous one. */
export function saveTestSession(record: NewSessionRecord): HotSeatSessionRecord {
  const current = historyStore.get();
  const now = new Date(record.timestamp);
  const fullRecord: HotSeatSessionRecord = {
    ...record,
    id: `hotseat-${record.timestamp}`,
    dayNumber: current.length + 1,
    dateStr: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    improvementDelta: computeImprovementDelta(current[current.length - 1], record),
  };
  historyStore.set([...current, fullRecord]);
  return fullRecord;
}
