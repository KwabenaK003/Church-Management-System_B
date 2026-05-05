"use client";

import {
  format,
  addDays,
  setYear,
  isEqual,
  parseISO,
  isBefore,
  startOfDay,
  differenceInYears,
} from "date-fns";
import { Cake } from "@phosphor-icons/react";

import { Member } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";

interface UpcomingBirthdaysProps {
  members: Member[];
}

interface UpcomingBirthday {
  id: string;
  fullName: string;
  initials: string;
  isToday: boolean;
  nextBirthday: Date;
  turningAge: number;
}

const UPCOMING_WINDOW_DAYS = 7;

function getInitials(firstName: string, lastName: string) {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function toUpcomingBirthday(
  member: Member,
  today: Date,
): UpcomingBirthday | null {
  if (!member.date_of_birth) {
    return null;
  }

  const birthDate = parseISO(member.date_of_birth);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const currentYear = today.getFullYear();
  const birthdayThisYear = setYear(birthDate, currentYear);
  const nextBirthday = isBefore(startOfDay(birthdayThisYear), today)
    ? setYear(birthDate, currentYear + 1)
    : birthdayThisYear;

  const upcomingWindowEnd = addDays(today, UPCOMING_WINDOW_DAYS);
  const birthdayDay = startOfDay(nextBirthday);

  if (
    isBefore(birthdayDay, today) ||
    isBefore(upcomingWindowEnd, birthdayDay)
  ) {
    return null;
  }

  const turningAge = differenceInYears(nextBirthday, birthDate);
  if (turningAge < 0 || Number.isNaN(turningAge)) {
    return null;
  }

  return {
    id: member.id,
    fullName: `${member.first_name} ${member.last_name}`.trim(),
    initials: getInitials(member.first_name, member.last_name),
    nextBirthday: birthdayDay,
    turningAge,
    isToday: isEqual(birthdayDay, today),
  };
}

export function UpcomingBirthdays({ members }: UpcomingBirthdaysProps) {
  const today = startOfDay(new Date());

  const upcomingBirthdays = members
    .map((member) => toUpcomingBirthday(member, today))
    .filter((birthday): birthday is UpcomingBirthday => birthday !== null)
    .sort((left, right) => {
      if (left.isToday && !right.isToday) {
        return -1;
      }

      if (!left.isToday && right.isToday) {
        return 1;
      }

      return left.nextBirthday.getTime() - right.nextBirthday.getTime();
    });

  const birthdayCount = upcomingBirthdays.length;
  const subtitle =
    birthdayCount === 1
      ? "1 birthday this week"
      : `${birthdayCount} birthdays this week`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]">
      <div className="border-b border-[var(--border-color)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-slate-600" weight="duotone" />
              <h2 className="font-serif text-2xl text-slate-800">
                Upcoming Birthdays
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {upcomingBirthdays.length === 0 ? (
        <EmptyState
          icon={<Cake className="h-6 w-6" />}
          title="No upcoming birthdays"
          description="No member birthdays in the next 7 days."
        />
      ) : (
        <ul className="divide-y divide-[var(--border-color)]">
          {upcomingBirthdays.map((birthday) => (
            <li
              key={birthday.id}
              className={`px-6 py-4 ${birthday.isToday ? "border-l-2 border-amber-400 bg-amber-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--neutral-bg)] text-xs font-semibold text-slate-700">
                    {birthday.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {birthday.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Turning {birthday.turningAge}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-500">
                    {format(birthday.nextBirthday, "d MMM")}
                  </p>
                  {birthday.isToday && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Today
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
