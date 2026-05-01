export type ElectionStatusLike = {
  status: string;
  election_date: string | null;
  start_time: string | null;
  end_time: string | null;
};

const ELECTION_TIMEZONE = "Africa/Lagos";

function normalizeTime(value: string): string {
  const [h = "00", m = "00", s = "00"] = value.split(":");
  return [h, m, s].map((part) => part.padStart(2, "0")).join(":");
}

function getNowInElectionTimezoneParts() {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: ELECTION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date());
  const read = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour")}:${read("minute")}:${read("second")}`,
  };
}

export function computeElectionStatus(election: ElectionStatusLike): "Upcoming" | "Live" | "Completed" | string {
  if (election.status === "Completed") return "Completed";
  if (!election.election_date || !election.start_time || !election.end_time) {
    return election.status;
  }

  const now = getNowInElectionTimezoneParts();
  const startTime = normalizeTime(election.start_time);
  const endTime = normalizeTime(election.end_time);

  if (now.date > election.election_date) return "Completed";
  if (now.date < election.election_date) return "Upcoming";
  if (now.time > endTime) return "Completed";
  if (now.time >= startTime && now.time <= endTime) return "Live";
  return "Upcoming";
}

export function computeElectionTimeTag(
  election: ElectionStatusLike
): "Upcoming" | "Live" | null {
  const status = computeElectionStatus(election);
  if (status === "Live" || status === "Upcoming") return status;
  return null;
}
