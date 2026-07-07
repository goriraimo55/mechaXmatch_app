"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award, BookOpen, Building2, Home, IdCard,
  Network, ScrollText, ShieldCheck, Star, Swords, User, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame, playerLevel, levelProgress } from "@/lib/game";
import { Progress } from "@/components/ui/progress";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: "学生メニュー",
    items: [
      { href: "/", label: "ホーム", icon: Home },
      { href: "/tutorial", label: "ライセンス講習", icon: IdCard },
      { href: "/quests", label: "クエスト", icon: Swords },
      { href: "/learn", label: "学習", icon: BookOpen },
      { href: "/skills", label: "スキルツリー", icon: Network },
      { href: "/team", label: "チームクエスト", icon: Users },
      { href: "/templates", label: "提出テンプレ", icon: ScrollText },
      { href: "/reviews", label: "相互評価", icon: Star },
      { href: "/profile", label: "プロフィール", icon: User },
      { href: "/certificate", label: "スキル証明書", icon: Award },
    ],
  },
  {
    label: "企業メニュー",
    items: [{ href: "/post", label: "仕事を投稿", icon: Building2 }],
  },
  {
    label: "教員メニュー",
    items: [{ href: "/teacher", label: "承認管理", icon: ShieldCheck }],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  compact = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        compact && "shrink-0 px-2.5 py-1.5",
        active
          ? "bg-primary/15 text-primary font-bold shadow-[inset_0_0_12px_rgba(34,211,238,0.12)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className={cn(compact && "text-xs")}>{label}</span>
    </Link>
  );
}

function PlayerMini() {
  const { state, hydrated } = useGame();
  const level = playerLevel(state.xp);
  const prog = levelProgress(state.xp);
  if (!hydrated) return null;
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple text-sm font-black text-background">
          {level}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{state.userName}</p>
          <p className="text-xs text-muted-foreground">{state.xp.toLocaleString()} XP</p>
        </div>
      </div>
      <Progress value={prog.percent} className="mt-2 h-1.5" />
      <p className="mt-1 text-right text-[10px] text-muted-foreground">
        次のLvまで {prog.next - prog.current} XP
      </p>
    </div>
  );
}

/** デスクトップ: 左サイドバー / モバイル: 上部ヘッダ+横スクロールナビ */
export function AppNav() {
  return (
    <>
      {/* デスクトップ サイドバー */}
      <aside className="print-hidden fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card/70 backdrop-blur lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple text-lg">
            ⚙️
          </div>
          <div>
            <p className="text-base font-black tracking-wide text-glow">
              Mecha<span className="text-primary">X</span>Match
            </p>
            <p className="text-[10px] text-muted-foreground">高専生の技術者ギルド</p>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="px-3 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground">
                {g.label}
              </p>
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3">
          <PlayerMini />
        </div>
      </aside>

      {/* モバイル ヘッダ */}
      <header className="print-hidden sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span className="font-black tracking-wide text-glow">
              Mecha<span className="text-primary">X</span>Match
            </span>
          </Link>
          <MobileXp />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </nav>
      </header>
    </>
  );
}

function MobileXp() {
  const { state, hydrated } = useGame();
  if (!hydrated) return null;
  return (
    <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
      Lv.{playerLevel(state.xp)}
      <span className="text-muted-foreground">|</span>
      {state.xp.toLocaleString()} XP
    </div>
  );
}
