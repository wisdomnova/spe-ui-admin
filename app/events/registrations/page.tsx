"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Calendar,
  Clock,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
  Download,
  Building2,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Registration {
  id: string;
  event_name: string;
  name: string;
  email: string;
  department: string;
  is_spe_member: boolean;
  is_membership_active: boolean | null;
  whatsapp_number: string | null;
  created_at: string;
  day1_claimed: boolean;
  day2_claimed: boolean;
  day3_claimed: boolean;
  access_code: string | null;
  selected_days: string | null;
}

function RegistrationsContent() {
  const searchParams = useSearchParams();
  const initialEventFilter = searchParams.get("event") || "All";

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>(initialEventFilter);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/events/registrations");
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch {
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  const handleClaimChange = async (reg: Registration, dayNum: number) => {
    const updatedFields = {
      id: reg.id,
      day1_claimed: dayNum === 1 ? true : reg.day1_claimed,
      day2_claimed: dayNum === 2 ? true : reg.day2_claimed,
      day3_claimed: dayNum === 3 ? true : reg.day3_claimed,
    };

    // Optimistic UI update
    setRegistrations((prev) =>
      prev.map((r) => (r.id === reg.id ? { ...r, ...updatedFields } : r))
    );

    try {
      const res = await fetch("/api/events/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (!res.ok) {
        fetchRegistrations();
      }
    } catch {
      fetchRegistrations();
    }
  };

  const eventOptions = useMemo(() => {
    const eventsSet = new Set(registrations.map((r) => r.event_name));
    return ["All", ...Array.from(eventsSet)];
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesEvent =
        selectedEvent === "All" ||
        reg.event_name.toLowerCase() === selectedEvent.toLowerCase();

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        reg.name.toLowerCase().includes(query) ||
        reg.email.toLowerCase().includes(query) ||
        reg.department.toLowerCase().includes(query) ||
        (reg.whatsapp_number || "").toLowerCase().includes(query) ||
        reg.event_name.toLowerCase().includes(query);

      return matchesEvent && matchesSearch;
    });
  }, [registrations, selectedEvent, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredRegistrations.length;
    const members = filteredRegistrations.filter((r) => r.is_spe_member);
    const activeMembers = members.filter((r) => r.is_membership_active).length;
    const waitlist = filteredRegistrations.filter((r) => !r.is_spe_member).length;
    return { total, activeMembers, waitlist };
  }, [filteredRegistrations]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const exportToCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "Department",
      "Event",
      "Access Code",
      "Selected Days",
      "SPE Member",
      "Membership Active",
      "WhatsApp Number",
      "Day 1 Claimed",
      "Day 2 Claimed",
      "Day 3 Claimed",
      "Registered Date",
      "Registered Time",
    ];

    const rows = filteredRegistrations.map((r) => {
      const { date, time } = formatDate(r.created_at);
      return [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.department.replace(/"/g, '""')}"`,
        `"${r.event_name.replace(/"/g, '""')}"`,
        `"${(r.access_code || "").replace(/"/g, '""')}"`,
        `"${(r.selected_days || "").replace(/"/g, '""')}"`,
        r.is_spe_member ? "Yes" : "No",
        r.is_spe_member
          ? r.is_membership_active
            ? "Yes"
            : "No"
          : "N/A",
        `"${(r.whatsapp_number || "").replace(/"/g, '""')}"`,
        r.day1_claimed ? "Yes" : "No",
        r.day2_claimed ? "Yes" : "No",
        r.day3_claimed ? "Yes" : "No",
        `"${date}"`,
        `"${time}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `event_registrations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-gray-950 tracking-tight">
                Event Registrations
              </h2>
              <p className="text-gray-500 font-bold mt-2">
                View, search and export attendees registered for chapter events.
              </p>
            </div>

            <div className="flex gap-4 self-start md:self-auto">
              <button
                onClick={fetchRegistrations}
                disabled={isRefreshing}
                className="group bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-800 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-75"
              >
                <RotateCw
                  size={16}
                  className={`transition-transform duration-500 ${
                    isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                  }`}
                />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredRegistrations.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </header>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Total Registrations
              </p>
              <h4 className="text-2xl font-black text-gray-950 mt-1">
                {stats.total}
              </h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-black">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Active SPE Members
              </p>
              <h4 className="text-2xl font-black text-gray-950 mt-1">
                {stats.activeMembers}
              </h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Clock3 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Guest Waitlist
              </p>
              <h4 className="text-2xl font-black text-gray-950 mt-1">
                {stats.waitlist}
              </h4>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 mb-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Search attendees by name, email, department, or WhatsApp..."
              className="w-full bg-gray-50 border-none rounded-3xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Event Selector Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest shrink-0 mr-2">
              Event:
            </span>
            {eventOptions.map((evt) => (
              <button
                key={evt}
                onClick={() => setSelectedEvent(evt)}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedEvent.toLowerCase() === evt.toLowerCase()
                    ? "bg-gray-950 text-white"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {evt}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Registrations */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">
              No registrations found
            </h3>
            <p className="text-gray-400 font-medium mt-1">
              {searchQuery
                ? "No attendees match your search query."
                : "Registrations will appear here once attendees sign up."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-gray-50 overflow-hidden w-full max-w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-8 py-7">Attendee</th>
                    <th className="px-8 py-7">Department</th>
                    <th className="px-8 py-7">Membership Status</th>
                    <th className="px-8 py-7">WhatsApp / Contact</th>
                    <th className="px-8 py-7">Day Claims</th>
                    <th className="px-8 py-7">Registered Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRegistrations.map((reg) => {
                    const { date, time } = formatDate(reg.created_at);
                    return (
                      <tr
                        key={reg.id}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Name & Email */}
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <div className="font-black text-gray-950 text-sm">
                              {reg.name}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-bold text-gray-400">
                              <span className="flex items-center gap-1.5">
                                <Mail size={13} className="text-blue-500" />
                                {reg.email}
                              </span>
                              {reg.access_code && (
                                <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wider w-fit">
                                  Code: {reg.access_code}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                              <Building2 size={14} className="text-gray-300" />
                              {reg.department}
                            </div>
                            {reg.selected_days && (
                              <div className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 w-fit uppercase tracking-widest text-[8px] font-black">
                                {reg.selected_days}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Membership Status Badge */}
                        <td className="px-8 py-6">
                          {reg.is_spe_member ? (
                            reg.is_membership_active ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border text-green-700 border-green-200 bg-green-50">
                                <CheckCircle2 size={13} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border text-amber-700 border-amber-200 bg-amber-50">
                                <XCircle size={13} />
                                Inactive
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border text-blue-700 border-blue-200 bg-blue-50">
                              <Clock3 size={13} />
                              Waitlist Guest
                            </span>
                          )}
                        </td>

                        {/* WhatsApp Number or N/A */}
                        <td className="px-8 py-6">
                          {reg.whatsapp_number ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50/60 px-3 py-1.5 rounded-xl border border-green-100 w-fit">
                              <Phone size={13} />
                              {reg.whatsapp_number}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-gray-300">
                              —
                            </span>
                          )}
                        </td>

                        {/* Day Claims */}
                        <td className="px-8 py-6">
                          <div className="flex gap-4 items-center">
                            {/* Day 1 */}
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={reg.day1_claimed}
                                disabled={reg.day1_claimed}
                                onChange={() => handleClaimChange(reg, 1)}
                                className="rounded border-gray-200 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className={`text-[10px] font-black uppercase tracking-wider ${reg.day1_claimed ? 'text-green-600 font-black' : 'text-gray-400 font-bold'}`}>D1</span>
                            </label>

                            {/* Day 2 */}
                            <label className={`flex items-center gap-1.5 ${(!reg.day1_claimed || reg.day2_claimed) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={reg.day2_claimed}
                                disabled={!reg.day1_claimed || reg.day2_claimed}
                                onChange={() => handleClaimChange(reg, 2)}
                                className="rounded border-gray-200 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className={`text-[10px] font-black uppercase tracking-wider ${(reg.day2_claimed) ? 'text-green-600 font-black' : 'text-gray-400 font-bold'}`}>D2</span>
                            </label>

                            {/* Day 3 */}
                            <label className={`flex items-center gap-1.5 ${(!reg.day2_claimed || reg.day3_claimed) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={reg.day3_claimed}
                                disabled={!reg.day2_claimed || reg.day3_claimed}
                                onChange={() => handleClaimChange(reg, 3)}
                                className="rounded border-gray-200 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className={`text-[10px] font-black uppercase tracking-wider ${(reg.day3_claimed) ? 'text-green-600 font-black' : 'text-gray-400 font-bold'}`}>D3</span>
                            </label>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                              <Calendar size={13} className="text-blue-500" />
                              {date}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                              <Clock size={12} className="text-gray-300" />
                              {time}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function EventRegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      }
    >
      <RegistrationsContent />
    </Suspense>
  );
}
