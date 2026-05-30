import Link from "next/link";

// -- App Mockup Components --

function MatcherMockup() {
  return (
    <div className="relative mx-auto max-w-sm w-full">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/8 overflow-hidden">
        <div className="bg-[#002A5C] px-4 py-2.5 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <span className="ml-3 bg-white/10 rounded-md px-3 py-0.5 text-white/40 text-xs font-mono flex-1 truncate">Varsio.app/match</span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Room &middot; K3X9PQ</p>
              <p className="text-xs text-gray-400 mt-0.5">2 students joined</p>
            </div>
            <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full border border-green-100">Live</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Shared courses</p>
          <div className="space-y-2 mb-4">
            {["CSC108H1 - LEC0201", "MAT137Y1 - LEC0301", "ECO101H1 - LEC5101"].map((c) => (
              <div key={c} className="flex items-center gap-2.5 bg-[#F4F6F9] rounded-xl px-3.5 py-2.5">
                <span className="w-2 h-2 rounded-full bg-[#1a8c4e] shrink-0" />
                <span className="text-xs font-mono font-semibold text-gray-700">{c}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#F0B429]/15 rounded-xl px-4 py-3 flex items-center justify-between border border-[#F0B429]/20">
            <span className="text-xs font-bold text-[#002A5C]">Share code</span>
            <span className="font-mono font-black text-[#002A5C] tracking-[0.2em] text-sm">K3X9PQ</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 bg-[#002A5C] text-white rounded-2xl px-4 py-2.5 shadow-xl text-xs font-semibold whitespace-nowrap">
        <span className="text-[#4ade80] font-black">3</span> courses in common
      </div>
    </div>
  );
}

function StudyMockup() {
  return (
    <div className="relative mx-auto max-w-sm w-full">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/8 overflow-hidden">
        <div className="bg-[#002A5C] px-4 py-2.5 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <span className="ml-3 bg-white/10 rounded-md px-3 py-0.5 text-white/40 text-xs font-mono flex-1 truncate">Varsio.app/study</span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">CSC108 Midterm</p>
              <p className="text-xs text-gray-400 mt-0.5">3 students &middot; AI Quiz</p>
            </div>
            <span className="text-xs bg-[#002A5C]/8 text-[#002A5C] font-semibold px-2.5 py-1 rounded-full">Q 2 / 5</span>
          </div>
          <div className="bg-[#F4F6F9] rounded-xl p-4 mb-3">
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              What does{" "}
              <code className="bg-white px-1.5 py-0.5 rounded text-[#002A5C] font-mono text-xs border border-gray-100">
                len([])
              </code>{" "}
              return in Python?
            </p>
          </div>
          <div className="space-y-2">
            {[
              { label: "A. None", correct: false },
              { label: "B. 0", correct: true },
              { label: "C. -1", correct: false },
              { label: "D. TypeError", correct: false },
            ].map(({ label, correct }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                  correct
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-white text-gray-500 border-gray-100"
                }`}
              >
                {correct && (
                  <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 bg-[#1a8c4e] text-white rounded-2xl px-4 py-2.5 shadow-xl text-xs font-semibold whitespace-nowrap">
        AI-generated from your notes
      </div>
    </div>
  );
}

// -- Mini feature cards --

const miniFeatures = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Course Chat",
    desc: "Post questions, find study partners, and talk by course. Everyone's tied to a real profile.",
    href: "/chat",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: "Explore",
    desc: "See which courses connect, find open study spots, swap sections, and check prof ratings.",
    href: "/explore",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Student Tools",
    desc: "Track deadlines, calculate your grade, and scan your syllabus. Built around how UofT actually works.",
    href: "/tools",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: "Marketplace",
    desc: "Buy textbooks from someone who just finished the course. Find a tutor in your program.",
    href: "/marketplace",
  },
];

// -- Stats --

const stats = [
  { value: "1,200+", label: "Active students", color: "text-[#F0B429]" },
  { value: "340+", label: "Courses tracked", color: "text-[#4ade80]" },
  { value: "89%", label: "Found a study partner", color: "text-white" },
  { value: "3", label: "Campuses supported", color: "text-white/70" },
];

// -- Page --

export default function Home() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-[#002A5C] text-white pt-20 pb-28 sm:pt-28 sm:pb-36 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/55 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            Now live &middot; St. George &middot; UTM &middot; UTSC
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-7">
            The student platform<br />
            <span className="text-[#F0B429]">UofT actually needed.</span>
          </h1>
          <p className="text-white/45 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Match courses with your friends, see who's in every lecture, and study together with AI. All in one spot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile"
              className="bg-[#F0B429] text-[#002A5C] font-bold px-8 py-4 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
            >
              Get Started Free &rarr;
            </Link>
            <Link
              href="/match"
              className="bg-white/8 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-sm hover:bg-white/12 transition-colors"
            >
              Match Your Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-gray-100 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Serving all three UofT campuses</p>
          {["St. George (UTSG)", "Mississauga (UTM)", "Scarborough (UTSC)"].map((c) => (
            <span key={c} className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#1a8c4e]" />
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Feature 1: Course Matcher */}
      <section className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <span className="inline-block text-xs font-bold text-[#002A5C] bg-[#002A5C]/8 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Course Matcher
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] mb-6">
              See exactly who&apos;s<br />in your courses.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Drop in a code and instantly see every course and section you share with your friends. Works across UTSG, UTM, and UTSC.
            </p>
            <Link
              href="/match"
              className="inline-flex items-center gap-2 bg-[#002A5C] text-white font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-[#003d80] transition-colors"
            >
              Start Matching &rarr;
            </Link>
          </div>
          <MatcherMockup />
        </div>
      </section>

      {/* Feature 2: AI Study Sessions */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 bg-[#F4F6F9]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="md:order-2">
            <span className="inline-block text-xs font-bold text-[#1a8c4e] bg-[#1a8c4e]/8 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              AI Study Sessions
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] mb-6">
              Your study group,<br />supercharged.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Throw in your notes, call in your friends, and get AI to quiz you on the stuff that actually matters. Keep it private or open it up.
            </p>
            <Link
              href="/study"
              className="inline-flex items-center gap-2 bg-[#1a8c4e] text-white font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-[#157a42] transition-colors"
            >
              Create a Session &rarr;
            </Link>
          </div>
          <div className="md:order-1">
            <StudyMockup />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#001d40] py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className={`text-4xl sm:text-5xl font-black mb-2 ${s.color}`}>{s.value}</div>
              <div className="text-white/35 text-xs uppercase tracking-widest font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mini features */}
      <section className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">The rest of the app.</h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Four more tools built for how UofT students actually get through the year.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {miniFeatures.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#002A5C]/20 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#002A5C] text-white flex items-center justify-center mb-5 group-hover:bg-[#003d80] transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#F4F6F9]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Student-friendly pricing.</h2>
            <p className="text-gray-400 text-lg">Start free. Upgrade if you want more.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-gray-900">$0</span>
              </div>
              <p className="text-gray-400 text-sm mb-8">Always free. No credit card.</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Course Matcher (unlimited rooms)",
                  "Community Chat",
                  "Study Sessions (3/month)",
                  "AI Quiz Generation (3/month)",
                  "Grade Calculator",
                  "Textbook Exchange",
                  "Explore & Swap Board",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#1a8c4e] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/profile"
                className="block text-center border-2 border-gray-200 text-gray-800 font-bold py-3.5 rounded-xl text-sm hover:border-gray-400 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#002A5C] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-5 right-5 bg-[#F0B429] text-[#002A5C] text-xs font-black px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Varsio Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black">$4.99</span>
                <span className="text-white/40 font-semibold mb-1">/mo</span>
              </div>
              <p className="text-white/50 text-sm mb-8">Everything in Free, plus:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited AI Quiz Generation",
                  "AI Deadline Tracker (syllabus scan)",
                  "Unlimited Study Sessions",
                  "Priority tutor placement",
                  "Study session analytics",
                  "Profile badge & verified status",
                  "Ad-free experience",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <svg className="w-4 h-4 text-[#F0B429] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-[#F0B429] text-[#002A5C] font-bold py-3.5 rounded-xl text-sm hover:bg-yellow-400 transition-colors">
                Upgrade to Pro &rarr;
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-10 pb-16">
        <div className="max-w-5xl mx-auto bg-[#002A5C] rounded-3xl py-20 sm:py-24 px-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F0B429]/5 via-transparent to-[#1a8c4e]/5 pointer-events-none" />
          <div className="relative">
            <p className="text-xs font-bold text-white/35 uppercase tracking-widest mb-5">Free to join</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-5 leading-[1.1]">
              Your people are<br />already on here.
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
              Takes a minute to set up. Just pick your courses and share your code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profile"
                className="bg-[#F0B429] text-[#002A5C] font-bold px-8 py-4 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
              >
                Create Your Profile &rarr;
              </Link>
              <Link
                href="/match"
                className="bg-white/8 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-sm hover:bg-white/12 transition-colors"
              >
                Match Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
