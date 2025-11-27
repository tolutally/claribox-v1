import React, { useState, useEffect } from "react";

type TopTab = "today" | "tasks" | "settings";

type EmailSummary = {
    id: string;
    subject: string;
    from: string;
    age: string;
    badge: "Important" | "Follow-up" | "Noise";
    preview: string;
};

// ----- TEMP DUMMY DATA (replace with real API later) -----
const demoSummary = {
    importantCount: 3,
    followUpCount: 2,
    noiseCount: 27,
};

const demoImportant: EmailSummary[] = [
    {
        id: "1",
        subject: "Interview prep session tomorrow",
        from: "Carmen @ SMU Careers",
        age: "2h ago",
        badge: "Important",
        preview: "Quick reminder about tomorrow's student prep call…",
    },
    {
        id: "2",
        subject: "Docs for SkillConnect pilot",
        from: "BBI Programs",
        age: "6h ago",
        badge: "Important",
        preview: "Attached is the draft MOU for the next cohort…",
    },
];

const demoFollowUps: EmailSummary[] = [
    {
        id: "3",
        subject: "Claribox beta invite",
        from: "Founder matchmaking list",
        age: "3d ago",
        badge: "Follow-up",
        preview: "Just checking if you had a chance to look at…",
    },
];

const demoNoiseSources = [
    { sender: "Substack Weekly", count: 9 },
    { sender: "Figma updates", count: 5 },
    { sender: "Product Hunt Digest", count: 3 },
];

// --------------------------------------------------------

export default function ClariboxSidePanel() {
    const [tab, setTab] = useState<TopTab>("today");
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<EmailSummary | null>(null);

    useEffect(() => {
        // Listen for force-close message from background (fallback for older Chrome)
        const handleMessage = (msg: any) => {
            if (msg?.type === "claribox/force-close-sidepanel") {
                window.close();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);
    const showToday = tab === "today";
    const showTasks = tab === "tasks";
    const showSettings = tab === "settings";

    return (
        <div className="h-full w-full bg-[#dde3ee] text-slate-900 flex justify-center">
            {/* Inner rounded panel, like Apollo */}
            <div className="w-full max-w-md h-full bg-white rounded-t-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.08)] flex flex-col overflow-hidden relative">
                {/* HEADER */}
                <header className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                        {/* Hamburger */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="p-1.5 rounded-full hover:bg-slate-200/70 active:scale-95 transition"
                            aria-label="Open Claribox menu"
                        >
                            <div className="space-y-0.5">
                                <span className="block h-0.5 w-4 bg-slate-900 rounded" />
                                <span className="block h-0.5 w-4 bg-slate-900 rounded" />
                                <span className="block h-0.5 w-3 bg-slate-900 rounded" />
                            </div>
                        </button>

                        {/* Logo + Brand */}
                        <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[11px] font-semibold text-white">
                                Cx
                            </div>
                            <span className="text-sm font-semibold tracking-tight">
                                Claribox
                            </span>
                        </div>
                    </div>

                    {/* Tabs + actions */}
                    <div className="flex items-center gap-2">
                        {/* Top tabs like "Settings / Upgrade" */}
                        <div className="flex rounded-full bg-slate-200/80 p-0.5">
                            <TabPill active={showToday} onClick={() => setTab("today")}>
                                Today
                            </TabPill>
                            <TabPill active={showTasks} onClick={() => setTab("tasks")}>
                                Tasks
                            </TabPill>
                            <TabPill active={showSettings} onClick={() => setTab("settings")}>
                                Settings
                            </TabPill>
                        </div>

                        {/* Refresh button */}
                        <button
                            className="p-1.5 rounded-full hover:bg-slate-200/70 active:scale-95 transition"
                            aria-label="Refresh Claribox data"
                        >
                            <RefreshIcon className="h-4 w-4 text-slate-700" />
                        </button>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto px-4 pb-4 pt-3 bg-white">
                    {showToday && (
                        <TodayView
                            summary={demoSummary}
                            important={demoImportant}
                            noiseSources={demoNoiseSources}
                            selected={selectedEmail}
                            onSelectEmail={setSelectedEmail}
                        />
                    )}

                    {showTasks && (
                        <TasksView
                            followUps={demoFollowUps}
                            onSelectEmail={setSelectedEmail}
                        />
                    )}

                    {showSettings && <SettingsView />}
                </main>

                {/* FOOTER */}
                <footer className="border-t border-slate-100 px-4 py-2 bg-slate-50/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                        Claribox • Inbox clarity for Gmail
                    </span>
                    <button className="text-[11px] text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline">
                        Give feedback
                    </button>
                </footer>

                {/* SLIDE-OUT MENU (like Apollo's) */}
                {menuOpen && (
                    <div className="absolute inset-0 z-20 flex">
                        <div className="w-64 h-full bg-white border-r border-slate-100 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[11px] font-semibold text-white">
                                        Cx
                                    </div>
                                    <span className="text-sm font-semibold">Claribox</span>
                                </div>
                                <button
                                    className="p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => setMenuOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <CloseIcon className="h-4 w-4 text-slate-600" />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto px-3 py-3 text-sm">
                                <MenuItem
                                    label="Inbox snapshot"
                                    active={showToday}
                                    onClick={() => {
                                        setTab("today");
                                        setMenuOpen(false);
                                    }}
                                />
                                <MenuItem
                                    label="Follow-ups"
                                    active={showTasks}
                                    onClick={() => {
                                        setTab("tasks");
                                        setMenuOpen(false);
                                    }}
                                />
                                <MenuItem
                                    label="Settings"
                                    active={showSettings}
                                    onClick={() => {
                                        setTab("settings");
                                        setMenuOpen(false);
                                    }}
                                />

                                <div className="my-3 h-px bg-slate-200" />

                                <MenuItem label="Help & guide" />
                                <button className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100">
                                    Open Claribox web app
                                </button>
                            </nav>

                            <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-800 text-[11px] font-semibold text-white flex items-center justify-center">
                                    TF
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">
                                        Tobi from SkillConnect
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        tobi@claribox.app
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="flex-1 bg-slate-900/10"
                            onClick={() => setMenuOpen(false)}
                            aria-label="Close menu overlay"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- SUBVIEWS ---------- */

function TodayView({
    summary,
    important,
    noiseSources,
    selected,
    onSelectEmail,
}: {
    summary: { importantCount: number; followUpCount: number; noiseCount: number };
    important: EmailSummary[];
    noiseSources: { sender: string; count: number }[];
    selected: EmailSummary | null;
    onSelectEmail: (e: EmailSummary | null) => void;
}) {
    return (
        <div className="flex flex-col gap-4">
            {/* Summary chips */}
            <div className="flex gap-2 flex-wrap">
                <SummaryChip label="Important" value={summary.importantCount} tone="red" />
                <SummaryChip
                    label="Follow-ups"
                    value={summary.followUpCount}
                    tone="blue"
                />
                <SummaryChip label="Noise" value={summary.noiseCount} tone="slate" />
            </div>

            {/* If no email selected yet → Apollo-like empty state */}
            {!selected && (
                <div className="flex flex-col items-center text-center mt-2 gap-4">
                    <EnvelopeIcon />
                    <div className="px-3">
                        <h2 className="text-base font-semibold text-slate-900">
                            Select an email in Gmail to see what matters
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Claribox will mark urgent threads, follow-ups, and low-priority
                            noise so you can focus on the signal.
                        </p>
                    </div>

                    {/* Quickstart card */}
                    <div className="w-full">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm px-4 py-3 text-left">
                            <h3 className="text-xs font-semibold text-slate-800">
                                Quickstart guide
                            </h3>
                            <div className="mt-2 space-y-2">
                                <QuickstartItem
                                    title="How Claribox ranks your inbox"
                                    description="Understand what makes an email 'Important' vs 'Noise'."
                                />
                                <QuickstartItem
                                    title="Tame your newsletters"
                                    description="Group promos and updates into a single quiet view."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Important list */}
            <section className="mt-1">
                <SectionHeader title="Important today" />
                {important.length === 0 ? (
                    <EmptyRow text="Nothing critical right now. Enjoy the calm ✨" />
                ) : (
                    <ul className="mt-1 space-y-1">
                        {important.map((email) => (
                            <EmailRow
                                key={email.id}
                                email={email}
                                onClick={() => onSelectEmail(email)}
                            />
                        ))}
                    </ul>
                )}
            </section>

            {/* Noise summary */}
            <section>
                <SectionHeader title="Noise sources" />
                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {noiseSources.map((src) => (
                        <div
                            key={src.sender}
                            className="flex items-center justify-between text-xs py-0.5"
                        >
                            <span className="truncate max-w-[70%] text-slate-700">
                                {src.sender}
                            </span>
                            <span className="text-[11px] text-slate-500">
                                {src.count} emails
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function TasksView({
    followUps,
    onSelectEmail,
}: {
    followUps: EmailSummary[];
    onSelectEmail: (e: EmailSummary | null) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <SectionHeader title="Follow-ups waiting on you" />
            {followUps.length === 0 ? (
                <EmptyRow text="No pending follow-ups. Claribox will flag any new ones." />
            ) : (
                <ul className="mt-1 space-y-1">
                    {followUps.map((email) => (
                        <EmailRow
                            key={email.id}
                            email={email}
                            onClick={() => onSelectEmail(email)}
                        />
                    ))}
                </ul>
            )}

            <p className="mt-2 text-[11px] text-slate-500">
                A follow-up is any thread where you sent the last message and haven't
                heard back after your chosen threshold.
            </p>
        </div>
    );
}

function SettingsView() {
    const [authLoading, setAuthLoading] = useState(false);
    const [authStatus, setAuthStatus] = useState<{
        isAuthenticated: boolean;
        userEmail: string | null;
        error: string | null;
    }>({
        isAuthenticated: false,
        userEmail: null,
        error: null
    });

    // Check auth status when component mounts
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setAuthLoading(true);
            const response = await fetch('http://localhost:3000/api/auth/status');
            if (response.ok) {
                const data = await response.json();
                setAuthStatus({
                    isAuthenticated: data.isAuthenticated,
                    userEmail: data.user?.email || null,
                    error: null
                });
            } else {
                setAuthStatus({
                    isAuthenticated: false,
                    userEmail: null,
                    error: null
                });
            }
        } catch (error) {
            setAuthStatus({
                isAuthenticated: false,
                userEmail: null,
                error: 'Failed to check authentication'
            });
        } finally {
            setAuthLoading(false);
        }
    };

    const connectGoogleAccount = () => {
        window.open(
            'http://localhost:3000/auth/google',
            'claribox-auth',
            'width=500,height=600'
        );
        // Simple check for auth completion
        setTimeout(() => {
            checkAuthStatus();
        }, 5000);
    };

    return (
        <div className="space-y-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Settings</h2>
            <p className="text-xs text-slate-500">
                Tune how Claribox summarizes your inbox. These are local to your
                account.
            </p>

            {/* Authentication Section */}
            <div className="space-y-3 border-t pt-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Account</h3>
                
                {authLoading ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-500">Checking authentication...</span>
                    </div>
                ) : authStatus.isAuthenticated ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-700">Connected</p>
                                <p className="text-xs text-slate-500">{authStatus.userEmail}</p>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <button
                            onClick={checkAuthStatus}
                            className="w-full px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                        >
                            Refresh Connection
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Not connected</span>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <button
                            onClick={connectGoogleAccount}
                            className="w-full px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        >
                            Connect Google Account
                        </button>
                    </div>
                )}
                
                {authStatus.error && (
                    <p className="text-xs text-red-500">{authStatus.error}</p>
                )}
            </div>

            {/* Preferences Section */}
            <div className="space-y-3 border-t pt-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Preferences</h3>
                <SettingRow
                    label="Daily digest time"
                    value="08:30 AM"
                    hint="Claribox will email you a snapshot of your inbox around this time."
                />
                <SettingRow
                    label="Follow-up threshold"
                    value="2 days"
                    hint="Threads with no reply after this are treated as follow-ups."
                />
                <SettingRow
                    label="Treat newsletters as noise"
                    value="Enabled"
                    hint="Use 'List-Unsubscribe' and promo labels to group low-priority mail."
                />
            </div>
        </div>
    );
}

/* ---------- SMALL COMPONENTS ---------- */

const TabPill: React.FC<
    React.PropsWithChildren<{ active?: boolean; onClick?: () => void }>
> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${active
            ? "bg-slate-900 text-slate-50 shadow-sm"
            : "text-slate-700 hover:bg-slate-300/60"
            }`}
    >
        {children}
    </button>
);

const SummaryChip: React.FC<{
    label: string;
    value: number;
    tone: "red" | "blue" | "slate";
}> = ({ label, value, tone }) => {
    const colors: Record<typeof tone, string> = {
        red: "bg-red-50 text-red-700 border-red-100",
        blue: "bg-sky-50 text-sky-700 border-sky-100",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${colors[tone]}`}
        >
            <span className="text-xs">{value}</span>
            <span>{label}</span>
        </div>
    );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
);

const EmailRow: React.FC<{ email: EmailSummary; onClick?: () => void }> = ({
    email,
    onClick,
}) => (
    <li>
        <button
            onClick={onClick}
            className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 px-3 py-2 flex flex-col gap-0.5 transition"
        >
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-slate-900">
                    {email.subject}
                </p>
                <span className="text-[10px] text-slate-500 shrink-0">
                    {email.age}
                </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate">{email.preview}</p>
            <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] text-slate-500 truncate max-w-[60%]">
                    {email.from}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700">
                    {email.badge}
                </span>
            </div>
        </button>
    </li>
);

const QuickstartItem: React.FC<{
    title: string;
    description: string;
}> = ({ title, description }) => (
    <button className="w-full text-left rounded-xl px-2 py-1.5 hover:bg-white/80 flex items-start justify-between gap-2">
        <div>
            <p className="text-xs font-medium text-slate-900">{title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        <span className="text-slate-400 text-xs mt-1">›</span>
    </button>
);

const SettingRow: React.FC<{
    label: string;
    value: string;
    hint?: string;
}> = ({ label, value, hint }) => (
    <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60">
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-900">{label}</span>
            <span className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {value}
            </span>
        </div>
        {hint && (
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">{hint}</p>
        )}
    </div>
);

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
    <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        {text}
    </div>
);

const MenuItem: React.FC<{
    label: string;
    active?: boolean;
    onClick?: () => void;
}> = ({ label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs mb-1 transition ${active
                ? "bg-slate-900 text-slate-50"
                : "text-slate-700 hover:bg-slate-100"
                }`}
        >
            <span>{label}</span>
        </button>
    );
};

/* ---------- ICONS ---------- */

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
    >
        <path d="M4 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
        <path
            d="M5 15a7 7 0 0 0 11.9 2.9L20 15M19 9A7 7 0 0 0 7.1 6.1L4 9"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
    >
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
);

const EnvelopeIcon: React.FC = () => (
    <div className="mt-4 h-20 w-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <div className="relative">
            <div className="h-10 w-14 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center">
                <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                >
                    <path
                        d="M4 8l8 6 8-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
                </svg>
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">
                ✦
            </div>
        </div>
    </div>
);
