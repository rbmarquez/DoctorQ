"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MiniCalendarProps {
  events?: {
    date: string;
    count: number;
  }[];
}

export function MiniCalendar({ events }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock events
  const mockEvents = events || [
    { date: "2025-11-04", count: 8 },
    { date: "2025-11-05", count: 6 },
    { date: "2025-11-06", count: 5 },
    { date: "2025-11-07", count: 7 },
    { date: "2025-11-08", count: 4 },
    { date: "2025-11-11", count: 9 },
  ];

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventCount = (date: Date | null) => {
    if (!date) return 0;
    const dateString = date.toISOString().split("T")[0];
    const event = mockEvents.find((e) => e.date === dateString);
    return event?.count || 0;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth();
  const totalEvents = mockEvents.reduce((acc, event) => acc + event.count, 0);
  const busyDays = mockEvents.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Calendário</h3>
          <p className="text-sm text-gray-600">Visão rápida do mês</p>
        </div>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h4 className="font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const eventCount = getEventCount(date);
            const today = isToday(date);

            return (
              <button
                key={index}
                disabled={!date}
                className={`aspect-square p-1 rounded-lg text-sm transition-all relative ${
                  !date
                    ? "invisible"
                    : today
                    ? "bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                    : eventCount > 0
                    ? "bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {date && (
                  <>
                    <span>{date.getDate()}</span>
                    {eventCount > 0 && !today && (
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span>Hoje</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 rounded-full" />
          <span>Com agendamentos</span>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-600">{totalEvents}</p>
            <p className="text-xs text-gray-600 mt-0.5">Total no Mês</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-xl font-bold text-green-600">{busyDays}</p>
            <p className="text-xs text-gray-600 mt-0.5">Dias Ocupados</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
        Ver Agenda Completa
      </Button>
    </div>
  );
}
