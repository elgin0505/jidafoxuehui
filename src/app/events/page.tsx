'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader, EmptyState } from '@/components/ui';
import { PageWrapper } from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import type { CalendarEvent } from '@/components/InteractivePaperCalendar';
import { DEFAULT_CALENDAR_EVENTS } from '@/components/InteractivePaperCalendar';
import { getCachedEvents, setCachedEvents, type EventItem } from '@/lib/eventsCache';
import { Clock, MapPin, Sparkles, Calendar as CalendarIcon, Download, ExternalLink, ChevronDown } from 'lucide-react';

// 按需异步代码分割重型 42KB 日历组件，释放首屏主线程
const InteractivePaperCalendar = dynamic(
  () => import('@/components/InteractivePaperCalendar').then((mod) => ({ default: mod.InteractivePaperCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#EFE5D0] animate-pulse border border-[#8A7A5E]/20" />
    ),
  }
);

interface Event {
  id: string;
  name: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  points: number;
}

// 安全提取日期格式 YYYY-MM-DD 与 HH:mm
function extractDateTime(dateTimeStr: string) {
  try {
    const d = new Date(dateTimeStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return {
        date: `${y}-${m}-${day}`,
        time: hours === '00' && mins === '00' ? '全天 / 待定' : `${hours}:${mins}`,
      };
    }
  } catch (err) {
    // ignore
  }

  // 纯文本兜底提取
  const datePart = dateTimeStr.split('T')[0];
  return {
    date: datePart || '2026-10-09',
    time: '18:00',
  };
}

export default function EventsPage() {
  // ⚡ 0ms 秒开：优先读取内存/会话缓存（如在 Dashboard 时已预拉取），实现首帧即渲染真实活动
  const [events, setEvents] = useState<EventItem[]>(() => getCachedEvents() || []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedEvents()?.length);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setCachedEvents(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load events:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* ══════════════════════════════════════════════════
     纯粹展示 Google 表格 gid=1001 绑定的活动 (迎新会 与 欢乐营)
     坚决剔除任何额外的 mock/seed 虚假数据
  ══════════════════════════════════════════════════ */
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (events.length === 0) {
      return DEFAULT_CALENDAR_EVENTS;
    }

    const now = new Date();
    return events.map((e) => {
      const { date, time } = extractDateTime(e.dateTime);
      const eventDate = new Date(e.dateTime);
      const isUpcoming = !isNaN(eventDate.getTime()) ? eventDate >= now : true;
      const isYingXin = e.name.includes('迎新');

      return {
        id: e.id,
        date,
        title: e.name,
        subtitle: isYingXin ? 'Orientation Day · 菩提新芽' : 'Dhamma Joy Camp · 乐满人间',
        time,
        location: e.location || '待定',
        points: e.points || 5,
        description:
          e.description ||
          (isYingXin
            ? '为协助新学子顺遂开启大学生涯，佛学会特别举办迎新会，旨在通过温馨破冰协助新学员打破陌生感、认识理事。'
            : '一整天的户外团康拓展与青年佛法体验。透过团队协作与欢乐互动，增进同修情谊与正向能量。'),
        accent: isYingXin ? '#B03A2E' : '#8A6B2E',
        rawDateTime: e.dateTime,
        status: isUpcoming ? 'upcoming' : 'past',
      };
    });
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return calendarEvents
      .filter((event) => event.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [calendarEvents]);

  return (
    <PageWrapper page="events">
      <PageHeader
        title="活动列表"
        subtitle="查看即将举行的佛学会活动，一键同步日历，参与活动获取功德积分"
      />

      {/* ═══════ 视觉核心：东方禅意壁纸交互日历 (图二风格 + 3D纸张翻页) ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-12"
      >
        <InteractivePaperCalendar events={calendarEvents} />
      </motion.div>

      {/* 雅致古典分割线 */}
      <div className="relative my-10 flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#8A7A5E]/25 to-transparent" />
        <span className="absolute bg-[#FAF7F2] dark:bg-slate-900 px-4 text-xs font-serif text-[#8A7A5E] tracking-widest">
          法音宣流 · 盛事一览
        </span>
      </div>

      {upcomingEvents.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
          title="暂无即将举行的活动"
          description="Google 表格中的活动即将更新，敬请同修善友期待"
        />
      ) : (
        /* ── 即将举行的活动（严格与 Google 表格同步的 2 场活动完全对应） ── */
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-[#2B241C] dark:text-warm-white font-serif">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#B03A2E] animate-pulse" />
              即将举行 · 随喜参加
            </h3>
            <span className="text-xs text-[#8A7A5E] font-medium">
              共 {upcomingEvents.length} 场活动
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {upcomingEvents.map((event, i) => (
              <EventParchmentCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </section>
      )}
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════════════
   古朴羊皮纸活动卡片 (Parchment Event Card)
══════════════════════════════════════════════════ */
function EventParchmentCard({ event, index }: { event: CalendarEvent; index: number }) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [year, month, day] = event.date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dateObj.getDay()];

  // Google Calendar URL
  const googleCalUrl = useMemo(() => {
    const timeClean = event.time.includes(':') ? event.time.replace(':', '') : '1800';
    const startStr = `${year}${month}${day}T${timeClean}00`;
    const startHour = Number(timeClean.slice(0, 2)) || 18;
    const endHour = String((startHour + 2) % 24).padStart(2, '0');
    const endStr = `${year}${month}${day}T${endHour}0000`;
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.subtitle || ''}\n\n${event.description}`);
    const loc = encodeURIComponent(event.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${loc}`;
  }, [year, month, day, event]);

  // 下载 .ics 文件
  const handleDownloadIcs = () => {
    const timeClean = event.time.includes(':') ? event.time.replace(':', '') : '1800';
    const startStr = `${year}${month}${day}T${timeClean}00`;
    const startHour = Number(timeClean.slice(0, 2)) || 18;
    const endHour = String((startHour + 2) % 24).padStart(2, '0');
    const endStr = `${year}${month}${day}T${endHour}0000`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jida Buddhist Society//Zen Calendar//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@jidabuddhist.org`,
      `DTSTAMP:${startStr}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.subtitle ? event.subtitle + '\\n' : '') + event.description}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}_${event.date}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowCalendarMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl
                 border border-[#8A7A5E]/25 dark:border-amber-900/30
                 bg-gradient-to-br from-[#FCFAF5] via-[#F9F4E8] to-[#F3EAD5]
                 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90
                 p-5 md:p-6
                 shadow-[0_10px_30px_-12px_rgba(40,30,20,0.12)]
                 hover:shadow-[0_15px_35px_-10px_rgba(40,30,20,0.2)]
                 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* 临近活动印章角标 */}
      <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-[#B03A2E] to-[#922B21] px-12 py-1 text-center text-[10px] font-bold tracking-widest text-white shadow-sm">
        即至
      </div>

      <div>
        {/* 顶部：日期方块与标题 */}
        <div className="flex items-start gap-4">
          {/* 古雅日期牌 */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#8A7A5E]/30 bg-[#F4ECDC]/90 dark:bg-slate-800 px-3.5 py-2 shadow-inner">
            <span className="text-[11px] font-bold text-[#B03A2E] tracking-wider">
              {Number(month)}月
            </span>
            <span
              className="text-2xl md:text-3xl font-bold text-[#2B241C] dark:text-warm-white tabular-nums leading-none"
              style={{ fontFamily: 'Georgia, "Songti SC", serif' }}
            >
              {day}
            </span>
          </div>

          <div className="flex-1 pr-6">
            <h4
              className="text-lg md:text-xl font-bold tracking-tight text-[#2B241C] dark:text-warm-white font-serif group-hover:text-[#B03A2E] transition-colors"
            >
              {event.title}
            </h4>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8A7A5E] dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-[#B03A2E]" />
              <span>{weekday} {event.time}</span>
            </p>
          </div>
        </div>

        {/* 活动详述 */}
        <p className="mt-3.5 text-xs md:text-sm text-[#5A4A38] dark:text-slate-300 leading-relaxed font-serif line-clamp-3">
          {event.description}
        </p>

        {/* 属性标签 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-[#EFE5D0]/80 dark:bg-slate-800 px-2.5 py-1 text-xs text-[#5A4A38] dark:text-slate-300 border border-[#8A7A5E]/15">
            <MapPin className="h-3.5 w-3.5 text-[#B03A2E]" />
            <span>{event.location}</span>
          </span>

          <span className="flex items-center gap-1 rounded-lg bg-[#B03A2E]/10 px-2.5 py-1 text-xs font-semibold text-[#B03A2E] border border-[#B03A2E]/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>+{event.points} 积分</span>
          </span>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="mt-5 flex items-center justify-between border-t border-[#8A7A5E]/15 pt-3.5">
        <span className="text-[11px] text-[#8A7A5E] font-serif">
          共修结缘
        </span>

        {/* 加入日历下拉菜单 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCalendarMenu(!showCalendarMenu)}
            className="flex items-center gap-1.5 rounded-xl border border-[#8A7A5E]/25 bg-[#FAF6EE] dark:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-[#5A4A38] dark:text-slate-200 hover:bg-[#F2E8D2] transition-colors shadow-2xs"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-[#B03A2E]" />
            <span>加入日历</span>
            <ChevronDown className="h-3 w-3 text-[#8A7A5E]" />
          </button>

          <AnimatePresence>
            {showCalendarMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl border border-[#8A7A5E]/20 bg-[#FAF7F2] dark:bg-slate-800 p-1.5 shadow-lg z-20"
              >
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowCalendarMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#4A3B2E] dark:text-slate-200 hover:bg-[#EFE5D0] dark:hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#B03A2E]" />
                  <span>Google 日历</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#4A3B2E] dark:text-slate-200 hover:bg-[#EFE5D0] dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-[#B03A2E]" />
                  <span>Apple / 本地 (.ics)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
