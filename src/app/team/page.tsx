"use client";

import { Building2, CalendarDays, Coins, Users } from "lucide-react";
import { TEAM_QUESTS } from "@/lib/data/team";
import { useGame } from "@/lib/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DangerLabels, SkillChips } from "@/components/quest-parts";
import { cn } from "@/lib/utils";

export default function TeamQuestsPage() {
  const { state, hydrated, applyToTeam } = useGame();
  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Users className="size-6 text-neon-purple" /> チームクエスト
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          機械・電気・情報…学科の壁を越えてパーティを組み、ひとりでは挑めない大型案件に挑戦しよう。
          参加申請すると<b className="text-neon-green">チーム開発スキル +30 XP</b>。
        </p>
      </div>

      <div className="space-y-5">
        {TEAM_QUESTS.map((tq) => {
          const appliedRole = state.teamApplications[tq.id];
          const totalCapacity = tq.roles.reduce((s, r) => s + r.capacity, 0);
          const totalMembers = tq.roles.reduce((s, r) => s + r.members.length, 0);

          return (
            <Card key={tq.id} className="border-neon-purple/30">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="purple">
                    <Users /> チームクエスト
                  </Badge>
                  <Badge variant="success">✅ 教員承認済み</Badge>
                  {appliedRole && <Badge variant="warning">申請中:{appliedRole}</Badge>}
                </div>
                <CardTitle className="text-lg">{tq.title}</CardTitle>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-4" /> {tq.company}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-neon-amber">
                    <Coins className="size-4" /> チーム報酬 ¥{tq.reward.toLocaleString()}
                  </span>
                  <span className="font-bold text-neon-green">チーム経験値 +{tq.xp} XP</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-4" /> 〆 {tq.deadline}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{tq.description}</p>
                <DangerLabels labels={tq.dangerLabels} />

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <p className="font-bold text-muted-foreground">募集中の役割</p>
                    <p className="text-muted-foreground">
                      メンバー <b className="text-foreground">{totalMembers}</b> / {totalCapacity} 人
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tq.roles.map((role) => {
                      const full = role.members.length >= role.capacity;
                      const isApplied = appliedRole === role.name;
                      return (
                        <div
                          key={role.name}
                          className={cn(
                            "rounded-lg border p-3",
                            isApplied && "border-neon-green/60 bg-neon-green/5",
                            full && !isApplied && "opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{role.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {role.members.length}/{role.capacity}人
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <SkillChips skillIds={role.requiredSkills} />
                          </div>
                          {role.members.length > 0 && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              参加中: {role.members.join("、")}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            variant={isApplied ? "success" : "default"}
                            disabled={full || !!appliedRole}
                            onClick={() => applyToTeam(tq.id, role.name)}
                          >
                            {isApplied
                              ? "✅ 申請済み"
                              : full
                                ? "満員"
                                : appliedRole
                                  ? "他の役割に申請中"
                                  : "🙋 参加申請する"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
