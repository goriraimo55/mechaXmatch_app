"use client";

import * as React from "react";
import { ChevronDown, ScrollText } from "lucide-react";
import { TEMPLATES } from "@/lib/data/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const [open, setOpen] = React.useState<string | null>(TEMPLATES[0].id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <ScrollText className="size-6 text-primary" /> 成果物 提出テンプレート
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          「何をどう出せばいいか」で迷わないための公式テンプレート。
          テンプレに沿って提出すれば、企業からの評価も上がりやすくなります。
        </p>
      </div>

      <div className="space-y-3">
        {TEMPLATES.map((t) => {
          const isOpen = open === t.id;
          return (
            <Card key={t.id} className={cn(isOpen && "border-primary/40")}>
              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() => setOpen(isOpen ? null : t.id)}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-xl">{t.icon}</span> {t.name}
                  </CardTitle>
                  <ChevronDown
                    className={cn("size-5 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                </CardHeader>
              </button>
              {isOpen && (
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-black tracking-wide text-primary">使用目的</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{t.purpose}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-black tracking-wide text-primary">記入項目</p>
                      <ul className="mt-1 space-y-1 text-muted-foreground">
                        {t.fields.map((f) => (
                          <li key={f} className="flex gap-2">
                            <span className="text-primary">▸</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-black tracking-wide text-primary">提出ファイル形式</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {t.fileFormats.map((f) => (
                            <Badge key={f} variant="secondary">{f}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-wide text-primary">評価ポイント</p>
                        <ul className="mt-1 space-y-1 text-muted-foreground">
                          {t.evaluationPoints.map((p) => (
                            <li key={p} className="flex gap-2">
                              <span className="text-neon-green">✓</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed bg-secondary/40 p-3">
                    <p className="text-xs font-black tracking-wide text-neon-amber">📝 サンプル記入例</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.sampleEntry}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
