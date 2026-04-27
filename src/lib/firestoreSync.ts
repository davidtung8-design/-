/**
 * firestoreSync.ts
 * 实时双向同步模块 — 替换旧的 /api/sync REST 方案
 * 
 * 架构：Firestore onSnapshot → 自动推送到所有已登录设备（iPhone + iPad）
 */

import { db } from './firebase';
import {
  doc, collection, query,
  onSnapshot, setDoc, deleteDoc,
  serverTimestamp, writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import type { PerfData, CalendarEvent, TodoItem, DailyData, ThemeKey } from '../types';

// ────────────────────────────────────────────
// 订阅函数 (READ — 实时监听)
// ────────────────────────────────────────────

/**
 * 订阅用户主数据（perfData, themeKey 等）
 * 任何设备写入 → 立刻推送到所有订阅方
 */
export function subscribeUserData(
  uid: string,
  onData: (data: { perfData?: PerfData; themeKey?: ThemeKey }) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as { perfData?: PerfData; themeKey?: ThemeKey });
      }
    },
    (error) => {
      console.error('[firestoreSync] subscribeUserData error:', error);
    }
  );
}

/**
 * 订阅日历事件子集合
 */
export function subscribeEvents(
  uid: string,
  onEvents: (events: CalendarEvent[]) => void
): Unsubscribe {
  const q = query(collection(db, `users/${uid}/events`));
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent));
    onEvents(events);
  });
}

/**
 * 订阅所有 Todo 项（按日期分组）
 */
export function subscribeTodos(
  uid: string,
  onTodos: (todos: Record<string, TodoItem[]>) => void
): Unsubscribe {
  const q = query(collection(db, `users/${uid}/todos`));
  return onSnapshot(q, (snap) => {
    const result: Record<string, TodoItem[]> = {};
    snap.docs.forEach(d => {
      result[d.id] = (d.data().items as TodoItem[]) || [];
    });
    onTodos(result);
  });
}

/**
 * 订阅每日数据（反思、感恩、6大任务、5352111协议）
 */
export function subscribeDailyData(
  uid: string,
  onDaily: (daily: Record<string, DailyData>) => void
): Unsubscribe {
  const q = query(collection(db, `users/${uid}/daily`));
  return onSnapshot(q, (snap) => {
    const result: Record<string, DailyData> = {};
    snap.docs.forEach(d => {
      result[d.id] = d.data() as DailyData;
    });
    onDaily(result);
  });
}

// ────────────────────────────────────────────
// 写入函数 (WRITE — 触发所有设备更新)
// ────────────────────────────────────────────

/**
 * 保存业绩主数据
 * 写入 → 触发所有设备的 subscribeUserData 回调
 */
export async function savePerfData(uid: string, perfData: PerfData): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      perfData,
      updatedAt: serverTimestamp(),
      updatedBy: navigator.userAgent.includes('iPad') ? 'iPad' : 'iPhone/Web',
    },
    { merge: true }
  );
}

/**
 * 保存主题设置
 */
export async function saveThemeKey(uid: string, themeKey: ThemeKey): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { themeKey, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * 保存/更新单个日历事件
 */
export async function saveEvent(uid: string, event: CalendarEvent): Promise<void> {
  await setDoc(
    doc(db, `users/${uid}/events`, event.id.toString()),
    { ...event, updatedAt: serverTimestamp() }
  );
}

/**
 * 删除日历事件
 */
export async function deleteEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, `users/${uid}/events`, eventId));
}

/**
 * 批量保存多个日历事件（初始化时使用）
 */
export async function saveAllEvents(uid: string, events: CalendarEvent[]): Promise<void> {
  const batch = writeBatch(db);
  events.forEach(event => {
    const ref = doc(db, `users/${uid}/events`, event.id.toString());
    batch.set(ref, { ...event, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

/**
 * 保存某天的 Todo 列表
 */
export async function saveTodos(uid: string, date: string, items: TodoItem[]): Promise<void> {
  await setDoc(
    doc(db, `users/${uid}/todos`, date),
    { items, updatedAt: serverTimestamp() }
  );
}

/**
 * 保存某天的每日数据（反思、感恩、6大任务等）
 */
export async function saveDailyData(uid: string, date: string, data: DailyData): Promise<void> {
  await setDoc(
    doc(db, `users/${uid}/daily`, date),
    { ...data, updatedAt: serverTimestamp() }
  );
}

// ────────────────────────────────────────────
// 一次性迁移：旧 REST 数据 → Firestore
// ────────────────────────────────────────────

/**
 * 将旧的 localStorage 数据迁移到 Firestore
 * 用户首次用新版登录时调用一次
 */
export async function migrateLocalStorageToFirestore(uid: string): Promise<void> {
  const savedPerf = localStorage.getItem('dt_perf');
  const savedEvents = localStorage.getItem('dt_events');
  const savedTodos = localStorage.getItem('dt_todos');
  const savedDaily = localStorage.getItem('dt_daily');

  if (savedPerf) {
    await savePerfData(uid, JSON.parse(savedPerf));
    console.log('[Migration] perfData migrated to Firestore');
  }

  if (savedEvents) {
    const events: CalendarEvent[] = JSON.parse(savedEvents);
    if (events.length > 0) {
      await saveAllEvents(uid, events);
      console.log(`[Migration] ${events.length} events migrated to Firestore`);
    }
  }

  if (savedTodos) {
    const todos: Record<string, TodoItem[]> = JSON.parse(savedTodos);
    for (const [date, items] of Object.entries(todos)) {
      if (items.length > 0) await saveTodos(uid, date, items);
    }
    console.log('[Migration] todos migrated to Firestore');
  }

  if (savedDaily) {
    const daily: Record<string, DailyData> = JSON.parse(savedDaily);
    for (const [date, data] of Object.entries(daily)) {
      await saveDailyData(uid, date, data);
    }
    console.log('[Migration] dailyData migrated to Firestore');
  }

  // 标记迁移完成，不再重复执行
  localStorage.setItem('dt_migrated_to_firestore', 'true');
}
