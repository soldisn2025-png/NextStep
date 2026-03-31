'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarPlus2,
  ChevronRight,
  Clock3,
  TriangleAlert,
} from 'lucide-react';
import {
  buildReminderItems,
  downloadReminderCalendarFile,
  getReminderLeadDaysLabel,
} from '@/lib/reminders';
import { ActionPlanProgressEntry, RecommendedAction } from '@/lib/types';

interface ReminderCenterProps {
  className?: string;
  items: Array<{
    action: RecommendedAction;
    entry: ActionPlanProgressEntry;
  }>;
}

const NOTIFICATION_LOG_STORAGE_KEY = 'nextstep_browser_reminder_log';

function readNotificationLog() {
  try {
    const rawValue = localStorage.getItem(NOTIFICATION_LOG_STORAGE_KEY);
    if (!rawValue) {
      return {} as Record<string, string>;
    }

    return JSON.parse(rawValue) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function writeNotificationLog(value: Record<string, string>) {
  try {
    localStorage.setItem(NOTIFICATION_LOG_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function getNotificationKey(actionId: string, followUpDate: string, reminderLeadDays: number | null) {
  return `${actionId}:${followUpDate}:${reminderLeadDays === null ? 'none' : reminderLeadDays}`;
}

export default function ReminderCenter({ className = 'mt-6', items }: ReminderCenterProps) {
  const reminderItems = useMemo(() => buildReminderItems(items), [items]);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (notificationPermission !== 'granted' || typeof window === 'undefined') {
      return;
    }

    const dueBrowserReminders = reminderItems.filter(
      (item) => item.reminderIsDue && item.entry.reminderLeadDays !== null && item.entry.nextFollowUpDate
    );

    if (dueBrowserReminders.length === 0) {
      return;
    }

    const notificationLog = readNotificationLog();
    let didWrite = false;

    dueBrowserReminders.forEach((item) => {
      const reminderKey = getNotificationKey(
        item.action.id,
        item.entry.nextFollowUpDate ?? '',
        item.entry.reminderLeadDays ?? null
      );
      const existingValue = notificationLog[reminderKey];

      if (existingValue === item.entry.nextFollowUpDate) {
        return;
      }

      const title =
        item.daysUntil < 0
          ? `Overdue follow-up: ${item.action.title}`
          : item.daysUntil === 0
            ? `Follow up today: ${item.action.title}`
            : `Reminder: ${item.action.title}`;
      const body =
        item.daysUntil < 0
          ? `This follow-up is overdue. Review the step notes and make the next contact.`
          : item.daysUntil === 0
            ? `Your planned follow-up is today. Open NextStep to review notes and details.`
            : `This follow-up is coming up on ${item.followUpDateLabel}.`;

      new Notification(title, { body });
      notificationLog[reminderKey] = item.entry.nextFollowUpDate ?? '';
      didWrite = true;
    });

    if (didWrite) {
      writeNotificationLog(notificationLog);
    }
  }, [notificationPermission, reminderItems]);

  const overdueCount = reminderItems.filter((item) => item.daysUntil < 0).length;
  const dueSoonCount = reminderItems.filter(
    (item) => item.daysUntil >= 0 && item.daysUntil <= 7
  ).length;
  const previewItems = reminderItems.slice(0, 4);

  return (
    <div className={`${className} rounded-[30px] border border-[#ddd3bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,243,235,0.98))] px-5 py-5 shadow-[0_22px_58px_-46px_rgba(54,44,28,0.55)] sm:px-6`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#6d6658] font-body">
            <BellRing size={13} className="text-[#7a724b]" />
            Reminder center
          </div>
          <h3 className="mt-4 font-heading text-[2rem] leading-tight text-text-main">
            Put follow-ups on a clock.
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            Once a step has a next follow-up date, it appears here automatically. That gives the dashboard a reason to be reopened and gives users a shortlist of what needs attention now.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#e3dac9] bg-white/88 px-4 py-4 lg:max-w-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            Browser alerts
          </p>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            Alerts are optional and local to this device. They can fire when the user opens the app, but this is not push messaging yet.
          </p>
          {notificationPermission === 'default' && (
            <button
              type="button"
              onClick={async () => {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a]"
            >
              <Bell size={14} />
              Enable browser alerts
            </button>
          )}
          {notificationPermission === 'granted' && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d4e4c8] bg-[#edf6e7] px-3 py-2 text-sm text-[#4f6d4e] font-body">
              <BellRing size={14} />
              Browser alerts enabled on this device
            </p>
          )}
          {notificationPermission === 'denied' && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#efd2ca] bg-[#fff2ef] px-3 py-2 text-sm text-[#a25547] font-body">
              <BellOff size={14} />
              Browser alerts are blocked in this browser
            </p>
          )}
          {notificationPermission === 'unsupported' && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e7decd] bg-[#fffdf8] px-3 py-2 text-sm text-[#6f6a5b] font-body">
              <BellOff size={14} />
              Browser alerts are not supported here
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[#e7decd] bg-[#fffdf8] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            Total follow-ups
          </p>
          <p className="mt-2 font-heading text-2xl text-text-main">{reminderItems.length}</p>
          <p className="text-xs text-[#8a8377] font-body">active steps with a follow-up date</p>
        </div>
        <div className="rounded-[22px] border border-[#f0dcc0] bg-[#fff7e8] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            Due this week
          </p>
          <p className="mt-2 font-heading text-2xl text-text-main">{dueSoonCount}</p>
          <p className="text-xs text-[#8a8377] font-body">follow-ups in the next 7 days</p>
        </div>
        <div className="rounded-[22px] border border-[#efd2ca] bg-[#fff2ef] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            Overdue
          </p>
          <p className="mt-2 font-heading text-2xl text-text-main">{overdueCount}</p>
          <p className="text-xs text-[#8a8377] font-body">follow-ups that already slipped</p>
        </div>
      </div>

      {reminderItems.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#ddd3bf] bg-white/78 px-4 py-5">
          <p className="text-sm text-[#625e53] font-body leading-relaxed">
            No follow-ups are scheduled yet. Add a `Next follow-up` date to any step to create an in-app reminder and optional calendar alarm.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {previewItems.map((item) => (
            <div
              key={`${item.action.id}-${item.entry.nextFollowUpDate}`}
              className="rounded-[24px] border border-[#e6dccb] bg-white/86 px-4 py-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${
                        item.dueState === 'overdue'
                          ? 'border-[#efd2ca] bg-[#fff2ef] text-[#a25547]'
                          : item.dueState === 'today'
                            ? 'border-[#f0dcc0] bg-[#fff7e8] text-[#95611f]'
                            : item.dueState === 'soon'
                              ? 'border-[#efe3c8] bg-[#faf3e5] text-[#7f6a2c]'
                              : 'border-[#d9e4d0] bg-[#f4f8ef] text-[#5e7153]'
                      }`}
                    >
                      {item.dueState === 'overdue'
                        ? 'Overdue'
                        : item.dueState === 'today'
                          ? 'Today'
                          : item.dueState === 'soon'
                            ? 'Soon'
                            : 'Scheduled'}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6f6a5b] font-body">
                      <Clock3 size={12} className="mr-1.5" />
                      {item.followUpDateLabel}
                    </span>
                    {item.entry.reminderLeadDays !== null && (
                      <span className="inline-flex items-center rounded-full border border-[#d9deee] bg-[#f4f6fc] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#5b5f82] font-body">
                        Alert {getReminderLeadDaysLabel(item.entry.reminderLeadDays ?? null)}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 font-heading text-2xl text-text-main">{item.action.title}</h4>
                  <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                    {item.daysUntil < 0
                      ? `This follow-up is ${Math.abs(item.daysUntil)} day${Math.abs(item.daysUntil) === 1 ? '' : 's'} overdue.`
                      : item.daysUntil === 0
                        ? 'This follow-up is due today.'
                        : `This follow-up is in ${item.daysUntil} day${item.daysUntil === 1 ? '' : 's'}.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <a
                    href={`#action-${item.action.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                  >
                    Jump to step
                    <ChevronRight size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadReminderCalendarFile(item.action, item.entry)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2 text-sm text-white font-body transition-colors hover:bg-[#5a583a]"
                  >
                    <CalendarPlus2 size={14} />
                    Add to calendar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {reminderItems.length > previewItems.length && (
            <p className="text-xs text-[#8a8377] font-body">
              {reminderItems.length - previewItems.length} more follow-up reminder{reminderItems.length - previewItems.length === 1 ? '' : 's'} are scheduled lower in the step list.
            </p>
          )}
        </div>
      )}

      {overdueCount > 0 && (
        <div className="mt-4 inline-flex items-start gap-2 rounded-[20px] border border-[#efd2ca] bg-[#fff2ef] px-4 py-3 text-sm text-[#8e5146] font-body">
          <TriangleAlert size={16} className="mt-0.5" />
          Overdue follow-ups should usually become the next focus unless there is a more urgent evaluation or school deadline.
        </div>
      )}
    </div>
  );
}
