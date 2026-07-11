import { useState } from "react";
import { locales } from "../locales/fa";
import { Shield, Users, Trash, Lightbulb } from "@phosphor-icons/react";

interface Cell {
  p1: number;
  p2: number;
}

type Preset = "PRISONER" | "BATTLE" | "HAWK_DOVE" | "MATCHING";

export default function Applet5_GameTheory() {
  const t = locales.applets.gameTheory;

  // Game payoff matrix state
  // [Up_Left, Up_Right, Down_Left, Down_Right]
  const [matrix, setMatrix] = useState<[Cell, Cell, Cell, Cell]>([
    { p1: 3, p2: 3 }, // Up, Left (Cooperate, Cooperate)
    { p1: 0, p2: 5 }, // Up, Right (Cooperate, Defect)
    { p1: 5, p2: 0 }, // Down, Left (Defect, Cooperate)
    { p1: 1, p2: 1 }, // Down, Right (Defect, Defect)
  ]);

  const [preset, setPreset] = useState<Preset>("PRISONER");

  // Interactive Repeated Play state
  const [humanHistory, setHumanHistory] = useState<("U" | "D")[]>([]);
  const [aiHistory, setAiHistory] = useState<("L" | "R")[]>([]);
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  // Apply Presets
  const applyPreset = (p: Preset) => {
    setPreset(p);
    setHumanHistory([]);
    setAiHistory([]);
    setHumanScore(0);
    setAiScore(0);
    if (p === "PRISONER") {
      setMatrix([
        { p1: 3, p2: 3 },
        { p1: 0, p2: 5 },
        { p1: 5, p2: 0 },
        { p1: 1, p2: 1 },
      ]);
    } else if (p === "BATTLE") {
      setMatrix([
        { p1: 2, p2: 1 },
        { p1: 0, p2: 0 },
        { p1: 0, p2: 0 },
        { p1: 1, p2: 2 },
      ]);
    } else if (p === "HAWK_DOVE") {
      setMatrix([
        { p1: 0, p2: 0 },
        { p1: 3, p2: 1 },
        { p1: 1, p2: 3 },
        { p1: 2, p2: 2 },
      ]);
    } else if (p === "MATCHING") {
      setMatrix([
        { p1: 1, p2: -1 },
        { p1: -1, p2: 1 },
        { p1: -1, p2: 1 },
        { p1: 1, p2: -1 },
      ]);
    }
  };

  // Modify cell payoff
  const updatePayoff = (index: number, player: "p1" | "p2", delta: number) => {
    setMatrix((prev) => {
      const next = [...prev] as [Cell, Cell, Cell, Cell];
      next[index] = {
        ...next[index],
        [player]: Math.max(-10, Math.min(10, next[index][player] + delta)),
      };
      return next;
    });
  };

  // 1. Solve Best Responses
  // Player 1 (Row)
  // If Col plays L (index 0 and 2): compare UL (index 0) and DL (index 2)
  const isP1BestUL = matrix[0].p1 >= matrix[2].p1;
  const isP1BestDL = matrix[2].p1 >= matrix[0].p1;
  // If Col plays R (index 1 and 3): compare UR (index 1) and DR (index 3)
  const isP1BestUR = matrix[1].p1 >= matrix[3].p1;
  const isP1BestDR = matrix[3].p1 >= matrix[1].p1;

  // Player 2 (Col)
  // If Row plays U (index 0 and 1): compare UL (index 0) and UR (index 1)
  const isP2BestUL = matrix[0].p2 >= matrix[1].p2;
  const isP2BestUR = matrix[1].p2 >= matrix[0].p2;
  // If Row plays D (index 2 and 3): compare DL (index 2) and DR (index 3)
  const isP2BestDL = matrix[2].p2 >= matrix[3].p2;
  const isP2BestDR = matrix[3].p2 >= matrix[2].p2;

  // 2. Solve Pure Nash Equilibria
  const pne: string[] = [];
  if (isP1BestUL && isP2BestUL) pne.push("(بالا، چپ)");
  if (isP1BestUR && isP2BestUR) pne.push("(بالا، راست)");
  if (isP1BestDL && isP2BestDL) pne.push("(پایین، چپ)");
  if (isP1BestDR && isP2BestDR) pne.push("(پایین، راست)");

  // 3. Solve Mixed Nash Equilibrium
  // Indifference conditions:
  // p = Pr(U). Player 2 is indifferent: p*UL.p2 + (1-p)*DL.p2 = p*UR.p2 + (1-p)*DR.p2
  // p*(UL.p2 - DL.p2 - UR.p2 + DR.p2) = DR.p2 - DL.p2
  const denomP = matrix[0].p2 - matrix[2].p2 - matrix[1].p2 + matrix[3].p2;
  const numP = matrix[3].p2 - matrix[2].p2;
  const pMix = denomP !== 0 ? numP / denomP : -1;

  // q = Pr(L). Player 1 is indifferent: q*UL.p1 + (1-q)*UR.p1 = q*DL.p1 + (1-q)*DR.p1
  // q*(UL.p1 - UR.p1 - DL.p1 + DR.p1) = DR.p1 - UR.p1
  const denomQ = matrix[0].p1 - matrix[1].p1 - matrix[2].p1 + matrix[3].p1;
  const numQ = matrix[3].p1 - matrix[1].p1;
  const qMix = denomQ !== 0 ? numQ / denomQ : -1;

  const hasMixed = pMix > 0 && pMix < 1 && qMix > 0 && qMix < 1;

  // Repeated Play Logic (Tit-for-Tat AI)
  const playRound = (playerMove: "U" | "D") => {
    // Tit-for-tat logic: Start with L (cooperate if Prisoner's Dilemma),
    // otherwise copy Row player's last move (Up => Left, Down => Right)
    let aiMove: "L" | "R" = "L";
    if (humanHistory.length > 0) {
      const lastHumanMove = humanHistory[humanHistory.length - 1];
      aiMove = lastHumanMove === "U" ? "L" : "R";
    }

    // Determine payoffs
    let payoffIndex = 0;
    if (playerMove === "U" && aiMove === "L") payoffIndex = 0;
    else if (playerMove === "U" && aiMove === "R") payoffIndex = 1;
    else if (playerMove === "D" && aiMove === "L") payoffIndex = 2;
    else if (playerMove === "D" && aiMove === "R") payoffIndex = 3;

    const roundP1 = matrix[payoffIndex].p1;
    const roundP2 = matrix[payoffIndex].p2;

    setHumanHistory((prev) => [...prev, playerMove]);
    setAiHistory((prev) => [...prev, aiMove]);
    setHumanScore((prev) => prev + roundP1);
    setAiScore((prev) => prev + roundP2);
  };

  const resetGame = () => {
    setHumanHistory([]);
    setAiHistory([]);
    setHumanScore(0);
    setAiScore(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Matrix Panel */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Shield className="text-blue-500" size={20} />
          ماتریس بازدهی ۲در۲ بازی
        </h3>

        {/* Preset selections */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => applyPreset("PRISONER")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              preset === "PRISONER"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 font-bold"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600"
            }`}
          >
            {t.prisonersDilemma}
          </button>
          <button
            onClick={() => applyPreset("BATTLE")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              preset === "BATTLE"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 font-bold"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600"
            }`}
          >
            {t.battleOfSexes}
          </button>
          <button
            onClick={() => applyPreset("HAWK_DOVE")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              preset === "HAWK_DOVE"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 font-bold"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600"
            }`}
          >
            {t.hawkDove}
          </button>
          <button
            onClick={() => applyPreset("MATCHING")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              preset === "MATCHING"
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 font-bold"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600"
            }`}
          >
            {t.matchingPennies}
          </button>
        </div>

        {/* Matrix grid container */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
          {/* Header row */}
          <div></div>
          <div className="py-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg font-bold">{t.left}</div>
          <div className="py-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg font-bold">{t.right}</div>

          {/* Row 1: Up */}
          <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-lg font-bold">{t.up}</div>
          {/* UL */}
          <div className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg relative bg-white dark:bg-zinc-900">
            <div className="flex justify-around items-center h-12">
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-blue-600 dark:text-blue-400 ${isP1BestUL ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[0].p1}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(0, "p1", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(0, "p1", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 ${isP2BestUL ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[0].p2}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(0, "p2", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(0, "p2", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
            </div>
          </div>
          {/* UR */}
          <div className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg relative bg-white dark:bg-zinc-900">
            <div className="flex justify-around items-center h-12">
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-blue-600 dark:text-blue-400 ${isP1BestUR ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[1].p1}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(1, "p1", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(1, "p1", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 ${isP2BestUR ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[1].p2}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(1, "p2", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(1, "p2", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Down */}
          <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-lg font-bold">{t.down}</div>
          {/* DL */}
          <div className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg relative bg-white dark:bg-zinc-900">
            <div className="flex justify-around items-center h-12">
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-blue-600 dark:text-blue-400 ${isP1BestDL ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[2].p1}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(2, "p1", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(2, "p1", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 ${isP2BestDL ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[2].p2}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(2, "p2", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(2, "p2", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
            </div>
          </div>
          {/* DR */}
          <div className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg relative bg-white dark:bg-zinc-900">
            <div className="flex justify-around items-center h-12">
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-blue-600 dark:text-blue-400 ${isP1BestDR ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[3].p1}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(3, "p1", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(3, "p1", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col items-center">
                <span className={`font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 ${isP2BestDR ? "underline decoration-double decoration-2" : ""}`}>
                  {matrix[3].p2}
                </span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updatePayoff(3, "p2", 1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">+</button>
                  <button onClick={() => updatePayoff(3, "p2", -1)} className="text-[10px] w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded">-</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100">
          <strong>راهنمای راهبرد غالب:</strong> بهترین پاسخ‌ها برای هر بازیکن با دوخط (زیرخط) مشخص شده‌اند. خانه‌ای که در آن هر دو عدد خط خورده باشند، تعادل نش خالص بازی است.
        </div>
      </div>

      {/* Analytical Panel */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Users className="text-emerald-500" size={20} />
          حل تعادل نش
        </h3>

        <div className="space-y-4 text-xs">
          {/* Pure NE */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
            <span className="font-bold text-blue-700 dark:text-blue-400 block mb-2">{t.nashPure}</span>
            {pne.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pne.map((eq, i) => (
                  <span key={i} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-2 py-1 rounded">
                    {eq}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-zinc-500 font-medium">هیچ تعادل نش خالصی وجود ندارد.</span>
            )}
          </div>

          {/* Mixed NE */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-2">{t.nashMixed}</span>
            {hasMixed ? (
              <div className="space-y-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                <div>
                  بازیکن ۱ (ردیف): بازی با استراتژی{" "}
                  <strong className="text-blue-600 font-mono">بالا</strong> با احتمال{" "}
                  <strong className="font-mono text-sm">{(pMix * 100).toFixed(0)}٪</strong>
                </div>
                <div>
                  بازیکن ۲ (ستون): بازی با استراتژی{" "}
                  <strong className="text-emerald-600 font-mono">چپ</strong> با احتمال{" "}
                  <strong className="font-mono text-sm">{(qMix * 100).toFixed(0)}٪</strong>
                </div>
              </div>
            ) : (
              <span className="text-zinc-500 font-medium">تعادل نش مختلط در استراتژی‌های محض نیست (یا وجود ندارد).</span>
            )}
          </div>
        </div>

        {/* repeated game player */}
        <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 space-y-4">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            {t.interactivePlay}
          </h4>

          <div className="flex gap-2">
            <button
              onClick={() => playRound("U")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-all"
            >
              انتخاب {t.up} (همکاری)
            </button>
            <button
              onClick={() => playRound("D")}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition-all"
            >
              انتخاب {t.down} (خیانت)
            </button>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
              <span className="text-zinc-500 block mb-1">{t.humanScore}</span>
              <strong className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">{humanScore}</strong>
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
              <span className="text-zinc-500 block mb-1">{t.aiScore}</span>
              <strong className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">{aiScore}</strong>
            </div>
          </div>

          {/* Reset repeated game button */}
          {humanHistory.length > 0 && (
            <button
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-red-500 transition-all"
            >
              <Trash size={14} />
              شروع مجدد شبیه‌ساز تعاملی
            </button>
          )}
        </div>
      </div>

      {/* History and Intuition Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Play History */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
            {t.history}
          </h4>

          {humanHistory.length > 0 ? (
            <div className="space-y-1 text-[10px] font-mono leading-none">
              {humanHistory.map((move, i) => (
                <div key={i} className="flex justify-between border-b border-zinc-50 dark:border-zinc-950 py-1">
                  <span className="text-zinc-500">دور {i + 1}:</span>
                  <span className="text-blue-600 font-bold">شما: {move === "U" ? "همکاری" : "خیانت"}</span>
                  <span className="text-emerald-600 font-bold">حریف: {aiHistory[i] === "L" ? "همکاری" : "خیانت"}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-zinc-500 font-medium">هنوز دوری بازی نشده است.</span>
          )}
        </div>

        {/* Insight Card */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>نکته نظریه بازی‌ها</span>
          </div>
          <p className="leading-relaxed">
            در معمای زندانی، هر دو بازیکن راهبرد غالب برای خیانت دارند که منجر به تعادل نش (خیانت، خیانت) می‌شود. این تعادل بهینه پارتو نیست؛ یعنی بازیکنان در صورت همکاری متقابل می‌توانند به مطلوبیت بالاتری دست یابند.
          </p>
        </div>
      </div>
    </div>
  );
}
