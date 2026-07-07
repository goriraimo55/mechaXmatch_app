"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, GraduationCap, RotateCcw } from "lucide-react";
import {
  TUTORIAL_MODULES,
  TUTORIAL_PASS_RATE,
  TUTORIAL_PASS_XP,
  TUTORIAL_QUIZ,
} from "@/lib/data/tutorial";
import { useGame, playerLevel } from "@/lib/game";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * ステップ構成:
 * 0     = ようこそ(プロローグ)
 * 1..5  = 教育モジュール(工学倫理/機密情報/安全管理/コミュニケーション/品質)
 * 6     = ミニテスト
 * 7     = ライセンス発行
 */
const TOTAL_STEPS = TUTORIAL_MODULES.length + 3;

export default function TutorialPage() {
  const { state, hydrated, completeTutorialModule, finishTutorial } = useGame();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<(number | null)[]>(
    Array(TUTORIAL_QUIZ.length).fill(null)
  );
  const [quizSubmitted, setQuizSubmitted] = React.useState(false);

  React.useEffect(() => {
    // 取得済みなら最初からライセンスカードを表示
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 復元後に一度だけ初期ステップを合わせる
    if (hydrated && state.tutorialCompleted) setStep(TOTAL_STEPS - 1);
  }, [hydrated, state.tutorialCompleted]);

  if (!hydrated) return null;

  const correctCount = answers.filter((a, i) => a === TUTORIAL_QUIZ[i].answerIndex).length;
  const scorePercent = Math.round((correctCount / TUTORIAL_QUIZ.length) * 100);
  const passed = correctCount / TUTORIAL_QUIZ.length >= TUTORIAL_PASS_RATE;
  const allAnswered = answers.every((a) => a !== null);

  const goQuizResult = () => {
    setQuizSubmitted(true);
    if (passed && !state.tutorialCompleted) {
      finishTutorial(scorePercent);
      setStep(TOTAL_STEPS - 1);
    }
  };

  const retryQuiz = () => {
    setAnswers(Array(TUTORIAL_QUIZ.length).fill(null));
    setQuizSubmitted(false);
    setStep(1); // 復習のため最初のモジュールへ戻す
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 進捗バー */}
      <div className="print-hidden">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p className="font-black tracking-widest text-primary">
            🪪 見習い技術者ライセンス講習
          </p>
          <p>
            STEP {Math.min(step + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
          </p>
        </div>
        <Progress value={((step + 1) / TOTAL_STEPS) * 100} className="mt-2" />
      </div>

      {/* STEP 0: ようこそ(プロローグ) */}
      {step === 0 && (
        <Card className="animate-pop-in border-primary/40 glow-cyan">
          <CardContent className="space-y-5 p-8 text-center">
            <p className="text-6xl">🏰</p>
            <h1 className="text-2xl font-black leading-relaxed">
              ようこそ、<span className="text-primary text-glow">技術者ギルド</span>へ。
            </h1>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                {state.userName} — 君は今日から、このギルドの<b className="text-foreground">新人メンバー</b>だ。
              </p>
              <p>
                ここには、実在する企業から届いた「本物の技術課題」がクエストとして集まっている。
                挑めば経験値と報酬、そして就活で使える実績が手に入る。
              </p>
              <p>
                ただし——企業クエストを受けるには、まず
                <b className="text-neon-amber">「見習い技術者ライセンス」</b>の取得が必要だ。
              </p>
              <p>
                工学倫理・機密情報・安全管理・報告の基本。
                プロの世界に踏み込む前に、5つの心得を身につけよう。
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {TUTORIAL_MODULES.map((m) => (
                <Badge key={m.id} variant="secondary">
                  {m.icon} {m.title}
                </Badge>
              ))}
            </div>
            <Button size="lg" onClick={() => setStep(1)}>
              講習をはじめる <ArrowRight />
            </Button>
            <p className="text-xs text-muted-foreground">
              修了ミニテストに合格すると +{TUTORIAL_PASS_XP} XP とライセンスバッジを獲得
            </p>
          </CardContent>
        </Card>
      )}

      {/* STEP 1-5: 教育モジュール */}
      {step >= 1 && step <= TUTORIAL_MODULES.length && (() => {
        const mod = TUTORIAL_MODULES[step - 1];
        const done = state.completedTutorialModules.includes(mod.id);
        return (
          <Card key={mod.id} className="animate-pop-in" style={{ borderColor: `${mod.color}55` }}>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                  style={{ background: `${mod.color}1a`, border: `1.5px solid ${mod.color}66` }}
                >
                  {mod.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground">
                    心得 その{step} / {TUTORIAL_MODULES.length}
                  </p>
                  <h2 className="text-xl font-black" style={{ color: mod.color }}>
                    {mod.title}
                  </h2>
                </div>
                {done && (
                  <Badge variant="success" className="ml-auto">
                    <CheckCircle2 /> 学習済み
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{mod.intro}</p>
              <ul className="space-y-2.5">
                {mod.points.map((p) => (
                  <li key={p} className="flex gap-2.5 rounded-lg border border-border/60 bg-secondary/40 p-3 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: mod.color }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  ← 戻る
                </Button>
                <Button
                  onClick={() => {
                    completeTutorialModule(mod.id);
                    setStep(step + 1);
                  }}
                >
                  理解した!次へ <ArrowRight />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* STEP 6: ミニテスト */}
      {step === TUTORIAL_MODULES.length + 1 && (
        <Card className="animate-pop-in border-neon-amber/40">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-4xl">📝</p>
              <h2 className="mt-2 text-xl font-black">修了ミニテスト</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                全{TUTORIAL_QUIZ.length}問・{Math.round(TUTORIAL_PASS_RATE * 100)}%以上の正解で合格。
                不合格の場合は復習からやり直しになります。
              </p>
            </div>

            {TUTORIAL_QUIZ.map((q, qi) => (
              <div key={qi} className="space-y-2">
                <p className="text-sm font-bold leading-relaxed">
                  Q{qi + 1}. {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.choices.map((c, ci) => {
                    const chosen = answers[qi] === ci;
                    const showResult = quizSubmitted;
                    const isCorrect = ci === q.answerIndex;
                    return (
                      <button
                        key={ci}
                        type="button"
                        disabled={quizSubmitted}
                        onClick={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? ci : a)))
                        }
                        className={cn(
                          "block w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          !showResult && chosen && "border-primary bg-primary/10 text-primary",
                          !showResult && !chosen && "hover:border-primary/50",
                          showResult && isCorrect && "border-neon-green bg-neon-green/10 text-neon-green",
                          showResult && chosen && !isCorrect && "border-destructive bg-destructive/10 text-destructive"
                        )}
                      >
                        {["A", "B", "C", "D"][ci]}. {c}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      answers[qi] === q.answerIndex ? "text-neon-green" : "text-neon-amber"
                    )}
                  >
                    {answers[qi] === q.answerIndex ? "🎉 正解! " : "❌ 不正解… "}
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {!quizSubmitted ? (
              <Button size="lg" className="w-full" disabled={!allAnswered} onClick={goQuizResult}>
                回答を提出する({answers.filter((a) => a !== null).length}/{TUTORIAL_QUIZ.length}問回答済み)
              </Button>
            ) : !passed ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-center">
                <p className="text-lg font-black text-destructive">
                  不合格… 正解 {correctCount}/{TUTORIAL_QUIZ.length}問({scorePercent}%)
                </p>
                <p className="text-sm text-muted-foreground">
                  合格ライン{Math.round(TUTORIAL_PASS_RATE * 100)}%に届きませんでした。
                  解説を読んで、心得の復習からもう一度挑戦しよう。
                </p>
                <Button variant="warning" onClick={retryQuiz}>
                  <RotateCcw /> 復習ページへ戻る
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* STEP 7: ライセンス発行 */}
      {step === TOTAL_STEPS - 1 && (
        <div className="space-y-5">
          <Card className="animate-pop-in overflow-hidden border-neon-green/50 glow-cyan">
            <div className="bg-gradient-to-r from-neon-cyan/20 via-neon-green/15 to-neon-purple/20 p-1" />
            <CardContent className="space-y-5 p-8 text-center">
              <p className="text-6xl">🪪</p>
              <h2 className="text-2xl font-black text-neon-green">
                見習い技術者ライセンス 発行!
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                おめでとう、{state.userName}。君は工学倫理・機密情報・安全管理・
                企業コミュニケーション・成果物品質の心得を修了した。
                今日から<b className="text-foreground">企業クエストの受注が可能</b>だ。
              </p>

              {/* ライセンスカード(ギルドカード風) */}
              <div className="mx-auto max-w-sm rounded-xl border border-neon-cyan/40 bg-gradient-to-br from-secondary to-card p-5 text-left shadow-lg">
                <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground">
                  <span>ENGINEER LICENSE</span>
                  <span>MechaXMatch GUILD</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple text-3xl">
                    {state.avatar}
                  </span>
                  <div>
                    <p className="text-lg font-black">{state.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {state.department} {state.grade} / Lv.{playerLevel(state.xp)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-background/50 p-2">
                    <p className="text-muted-foreground">資格</p>
                    <p className="font-bold text-neon-green">見習い技術者</p>
                  </div>
                  <div className="rounded-md bg-background/50 p-2">
                    <p className="text-muted-foreground">テストスコア</p>
                    <p className="font-bold">{state.tutorialQuizScore ?? scorePercent}%</p>
                  </div>
                  <div className="col-span-2 rounded-md bg-background/50 p-2">
                    <p className="text-muted-foreground">発行日</p>
                    <p className="font-bold">
                      {state.licenseIssuedAt
                        ? new Date(state.licenseIssuedAt).toLocaleDateString("ja-JP")
                        : new Date().toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <BadgeCheck className="size-3.5 text-neon-green" />
                  工学倫理・機密情報・安全管理・報告基礎 修了済み
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/quests" className={cn(buttonVariants({ size: "lg" }))}>
                  ⚔️ さっそくクエストボードへ
                </Link>
                <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  ホームに戻る
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
              <GraduationCap className="size-5 shrink-0 text-primary" />
              講習内容はいつでもこのページで復習できます。迷ったら「心得」に立ち返ろう。
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
