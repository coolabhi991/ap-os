import {
  Bell,
  CalendarDays,
  Search,
  Sparkles,
  UserCircle2,
} from "lucide-react";

export default function Header() {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : "Good Evening";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="mx-5 mt-5 mb-4">

      <div className="flex h-[78px] items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-6 backdrop-blur-3xl shadow-[0_10px_30px_rgba(15,23,42,.05)]">

        {/* ---------------------------------------------------------------- */}
        {/* Left */}
        {/* ---------------------------------------------------------------- */}

        <div>

          <p className="text-xs font-medium tracking-wide text-slate-400">
            {today}
          </p>

          <h1 className="mt-1 text-[28px] font-bold leading-none tracking-tight text-slate-900">
            {greeting}, Abhijit
          </h1>

        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Search */}
        {/* ---------------------------------------------------------------- */}

        <div className="hidden xl:flex w-[420px]">

          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-[#FCFCFD] px-5 py-3 transition-all duration-200 hover:border-[#D8B44A]">

            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

          </div>

        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex items-center gap-3">

          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5">

            <CalendarDays
              size={18}
              className="text-slate-600"
            />

          </button>

          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5">

            <Bell
              size={18}
              className="text-slate-600"
            />

            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500"></span>

          </button>

          <button className="flex h-11 items-center gap-2 rounded-xl bg-[#243247] px-4 text-white shadow-md transition hover:scale-[1.02]">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8B44A]">

              <Sparkles
                size={14}
                className="text-white"
              />

            </div>

            <span className="text-sm font-semibold">
              APCI
            </span>

          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">

            <UserCircle2
              size={38}
              className="text-[#B98A1F]"
            />

            <div>

              <h3 className="text-sm font-semibold text-slate-900">
                Abhijit Patil
              </h3>

              <p className="text-xs text-slate-500">
                Founder
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}