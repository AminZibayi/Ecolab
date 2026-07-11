import React, { useState } from "react";
import { locales } from "../locales/fa";
import { ChartBar, Scales, Lightbulb } from "@phosphor-icons/react";

type UtilityType = "COBB_DOUGLAS" | "SUBSTITUTES" | "COMPLEMENTS";

export default function Applet2_ConsumerChoice() {
  const t = locales.applets.consumerChoice;

  // Sliders state
  const [income, setIncome] = useState(100);
  const [px, setPx] = useState(5);
  const [py, setPy] = useState(5);
  const [taxX, setTaxX] = useState(3);
  const [utilityType, setUtilityType] = useState<UtilityType>("COBB_DOUGLAS");
  const [alpha, setAlpha] = useState(0.5); // Cobb-Douglas alpha or substitute/complement ratio

  // SVG parameters
  const width = 400;
  const height = 400;
  const padding = 45;

  // Max quantities for scale (e.g. max x = 50, max y = 50)
  const maxX = 40;
  const maxY = 40;

  const toSvgX = (x: number) => padding + (x / maxX) * (width - 2 * padding);
  const toSvgY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding);

  const getClippedBudgetLine = (priceX: number, priceY: number, W: number) => {
    if (W <= 0) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    const y1 = Math.min(maxY, W / priceY);
    const x1 = (W - priceY * y1) / priceX;
    const x2 = Math.min(maxX, W / priceX);
    const y2 = (W - priceX * x2) / priceY;
    return { x1, y1, x2, y2 };
  };

  // Math engines for the three utility types:
  // 1. Cobb-Douglas: u(x,y) = x^a * y^(1-a)
  // 2. Substitutes: u(x,y) = a*x + y
  // 3. Complements: u(x,y) = min(a*x, y)

  const solveOptimal = (W: number, priceX: number, priceY: number) => {
    if (utilityType === "COBB_DOUGLAS") {
      const x = (alpha * W) / priceX;
      const y = ((1 - alpha) * W) / priceY;
      const u = Math.pow(x, alpha) * Math.pow(y, 1 - alpha);
      return { x, y, u };
    } else if (utilityType === "SUBSTITUTES") {
      // u = alpha * x + y
      // Compare marginal utility per dollar: alpha/priceX vs 1/priceY
      const muX = alpha / priceX;
      const muY = 1 / priceY;
      if (muX > muY) {
        const x = W / priceX;
        return { x, y: 0, u: alpha * x };
      } else if (muX < muY) {
        const y = W / priceY;
        return { x: 0, y, u: y };
      } else {
        // Indifferent, say split 50/50
        const x = W / (2 * priceX);
        const y = W / (2 * priceY);
        return { x, y, u: alpha * x + y };
      }
    } else {
      // COMPLEMENTS: u = min(alpha * x, y)
      // Bundle lies on ray y = alpha * x
      // Budget: priceX * x + priceY * y = W => priceX * x + priceY * alpha * x = W
      const x = W / (priceX + priceY * alpha);
      const y = alpha * x;
      const u = x * alpha; // since alpha*x = y, min is alpha*x
      return { x, y, u };
    }
  };

  // Case 0: No Tax
  const opt0 = solveOptimal(income, px, py);

  // Case A: Quantity Tax t on Good X
  // Effective price of X becomes px + taxX
  const effectivePx = px + taxX;
  const optTaxX = solveOptimal(income, effectivePx, py);

  // Government Revenue from Quantity Tax
  const govRev = taxX * optTaxX.x;

  // Case B: Equivalent Income Tax T = govRev
  // Remaining income becomes income - govRev
  const remainingIncome = Math.max(0, income - govRev);
  const optTaxIncome = solveOptimal(remainingIncome, px, py);

  // Equivalent utility difference for deadweight loss representation
  const dwl = Math.max(0, optTaxIncome.u - optTaxX.u);

  // Helper to get indifference curve path
  const getIndifferencePath = (u: number) => {
    let path = "";
    if (utilityType === "COBB_DOUGLAS") {
      // u = x^a * y^(1-a) => y = (u / x^a)^(1/(1-a))
      let first = true;
      for (let x = 0.5; x <= maxX; x += 0.5) {
        const y = Math.pow(u / Math.pow(x, alpha), 1 / (1 - alpha));
        if (y >= 0 && y <= maxY) {
          const sx = toSvgX(x);
          const sy = toSvgY(y);
          path += `${first ? "M" : "L"} ${sx} ${sy} `;
          first = false;
        }
      }
    } else if (utilityType === "SUBSTITUTES") {
      // u = alpha * x + y => y = u - alpha * x
      const xStart = 0;
      const yStart = u;
      const xEnd = u / alpha;
      const yEnd = 0;

      if (yStart <= maxY && xEnd <= maxX) {
        path = `M ${toSvgX(xStart)} ${toSvgY(yStart)} L ${toSvgX(xEnd)} ${toSvgY(yEnd)}`;
      } else {
        // Clip to viewport
        const x1 = Math.max(0, (u - maxY) / alpha);
        const y1 = Math.min(maxY, u - alpha * x1);
        const x2 = Math.min(maxX, u / alpha);
        const y2 = Math.max(0, u - alpha * x2);
        path = `M ${toSvgX(x1)} ${toSvgY(y1)} L ${toSvgX(x2)} ${toSvgY(y2)}`;
      }
    } else {
      // COMPLEMENTS: L-shape with vertex at (u/alpha, u)
      const vx = u / alpha;
      const vy = u;
      if (vx <= maxX && vy <= maxY) {
        path = `M ${toSvgX(vx)} ${toSvgY(maxY)} L ${toSvgX(vx)} ${toSvgY(vy)} L ${toSvgX(maxX)} ${toSvgY(vy)}`;
      }
    }
    return path;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Chart Panel (Left Column) - Wide & Prominent */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <ChartBar className="text-emerald-500" size={20} />
          نقشه بودجه و ترجیحات مصرف‌کننده
        </h3>

        <div className="relative flex justify-center">
          <svg width={width} height={height} className="overflow-hidden select-none max-w-full">
            {/* Grid background lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const val = (i + 1) * 10;
              return (
                <React.Fragment key={val}>
                  <line
                    x1={toSvgX(val)}
                    y1={toSvgY(0)}
                    x2={toSvgX(val)}
                    y2={toSvgY(maxY)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(val)}
                    x2={toSvgX(maxX)}
                    y2={toSvgY(val)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                  <text
                    x={toSvgX(val)}
                    y={toSvgY(0) + 14}
                    textAnchor="middle"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {val}
                  </text>
                  <text
                    x={toSvgX(0) - 8}
                    y={toSvgY(val) + 3}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {val}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Axes */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(maxX)} y2={toSvgY(0)} stroke="#71717a" strokeWidth={1.5} />
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(maxY)} stroke="#71717a" strokeWidth={1.5} />

            {/* Budget Line 0 (No Tax) */}
            {(() => {
              const bl = getClippedBudgetLine(px, py, income);
              return (
                <line
                  x1={toSvgX(bl.x1)}
                  y1={toSvgY(bl.y1)}
                  x2={toSvgX(bl.x2)}
                  y2={toSvgY(bl.y2)}
                  stroke="#cbd5e1"
                  className="dark:stroke-zinc-700"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              );
            })()}

            {/* Budget Line A (Quantity Tax) */}
            {(() => {
              const bl = getClippedBudgetLine(effectivePx, py, income);
              return (
                <line
                  x1={toSvgX(bl.x1)}
                  y1={toSvgY(bl.y1)}
                  x2={toSvgX(bl.x2)}
                  y2={toSvgY(bl.y2)}
                  stroke="#f43f5e"
                  strokeWidth={2}
                />
              );
            })()}

            {/* Budget Line B (Equivalent Income Tax) */}
            {(() => {
              const bl = getClippedBudgetLine(px, py, remainingIncome);
              return (
                <line
                  x1={toSvgX(bl.x1)}
                  y1={toSvgY(bl.y1)}
                  x2={toSvgX(bl.x2)}
                  y2={toSvgY(bl.y2)}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              );
            })()}

            {/* Indifference Curves */}
            {/* 1. Indifference Curve through Quantity Tax optimal point */}
            <path d={getIndifferencePath(optTaxX.u)} fill="none" stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />

            {/* 2. Indifference Curve through Income Tax optimal point */}
            <path d={getIndifferencePath(optTaxIncome.u)} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.8} />

            {/* Optimal Points */}
            {/* E0 (No Tax) */}
            <circle cx={toSvgX(opt0.x)} cy={toSvgY(opt0.y)} r={4} fill="#94a3b8" />
            <text x={toSvgX(opt0.x) + 6} y={toSvgY(opt0.y) - 6} className="text-[10px] fill-zinc-500 font-bold font-mono">E0</text>

            {/* Et (Quantity Tax) */}
            <circle cx={toSvgX(optTaxX.x)} cy={toSvgY(optTaxX.y)} r={5} fill="#f43f5e" />
            <text x={toSvgX(optTaxX.x) + 6} y={toSvgY(optTaxX.y) - 6} className="text-[10px] fill-rose-600 font-bold font-mono">Et</text>

            {/* ET (Income Tax) */}
            <circle cx={toSvgX(optTaxIncome.x)} cy={toSvgY(optTaxIncome.y)} r={5} fill="#3b82f6" />
            <text x={toSvgX(optTaxIncome.x) + 6} y={toSvgY(optTaxIncome.y) - 6} className="text-[10px] fill-blue-600 font-bold font-mono">ET</text>

            {/* Axis titles */}
            <text x={toSvgX(maxX / 2)} y={toSvgY(0) + 28} textAnchor="middle" className="text-[10px] fill-zinc-500">کالای X</text>
            <text x={toSvgX(0) - 24} y={toSvgY(maxY / 2)} textAnchor="middle" transform={`rotate(-90, ${toSvgX(0) - 24}, ${toSvgY(maxY / 2)})`} className="text-[10px] fill-zinc-500">کالای Y</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
            <span className="text-zinc-500">E0: بدون مالیات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
            <span className="text-zinc-500">Et: مالیات بر کالا X</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span className="text-zinc-500">ET: مالیات بر درآمد</span>
          </div>
        </div>
      </div>

      {/* Right Column Stack (Controls & Results) - Generous Spacing */}
      <div className="lg:col-span-5 space-y-6">
        {/* Controls Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Scales className="text-blue-500" size={20} />
            تنظیمات بازار و مصرف‌کننده
          </h3>

          {/* Utility Type Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-500 block mb-2">{t.utilityType}</label>
            <div className="flex flex-col gap-2">
              {(["COBB_DOUGLAS", "SUBSTITUTES", "COMPLEMENTS"] as UtilityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setUtilityType(type)}
                  className={`w-full text-right flex justify-between items-center text-xs py-2.5 px-3 rounded-lg border font-bold transition-all ${
                    utilityType === type
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span>
                    {type === "COBB_DOUGLAS" && t.cobbDouglas}
                    {type === "SUBSTITUTES" && t.perfectSubstitutes}
                    {type === "COMPLEMENTS" && t.perfectComplements}
                  </span>
                  <span className="text-[10px] opacity-75 font-normal">
                    {type === "COBB_DOUGLAS" && "تابع مطلوبیت هموار"}
                    {type === "SUBSTITUTES" && "خط‌های مطلوبیت مستقیم"}
                    {type === "COMPLEMENTS" && "مطلوبیت‌های مکمل L شکل"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.income}</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{income}</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.priceX}</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{px}</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={0.5}
                value={px}
                onChange={(e) => setPx(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.priceY}</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{py}</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={0.5}
                value={py}
                onChange={(e) => setPy(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.taxX}</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{taxX}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={taxX}
                onChange={(e) => setTaxX(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {utilityType === "COBB_DOUGLAS"
                    ? "سهم ترجیح کالای α) X)"
                    : utilityType === "SUBSTITUTES"
                    ? "نرخ نهایی جانشینی (MUx/MUy)"
                    : "نسبت مصرف کالاها (Y/X)"}
                </span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{alpha.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.1}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
            تحلیل سیاست‌های مالیاتی
          </h4>

          {/* Revenue */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-bold">{t.govRevenue}</span>
            <span className="font-mono text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {govRev.toFixed(1)} واحد
            </span>
          </div>

          <hr className="border-zinc-150 dark:border-zinc-800" />

          {/* Policy A */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400">مالیات بر کالا X</h5>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">سبد مصرفی:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold whitespace-nowrap">
                ({optTaxX.x.toFixed(1)}، {optTaxX.y.toFixed(1)})
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">{t.consumerUtility}</span>
              <span className="font-mono text-rose-600 font-extrabold">{optTaxX.u.toFixed(2)}</span>
            </div>
          </div>

          <hr className="border-zinc-150 dark:border-zinc-800" />

          {/* Policy B */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400">مالیات بر درآمد</h5>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">سبد مصرفی:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold whitespace-nowrap">
                ({optTaxIncome.x.toFixed(1)}، {optTaxIncome.y.toFixed(1)})
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">{t.consumerUtility}</span>
              <span className="font-mono text-blue-600 font-extrabold">{optTaxIncome.u.toFixed(2)}</span>
            </div>
          </div>

          <hr className="border-zinc-150 dark:border-zinc-800" />

          {/* Deadweight Loss */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg flex justify-between items-center text-xs">
            <span className="text-amber-700 dark:text-amber-400 font-bold">
              بار اضافی رفاهی (Deadweight Loss):
            </span>
            <span className="font-mono text-xs font-black text-amber-800 dark:text-amber-300 whitespace-nowrap">
              {dwl > 0.01 ? `+${dwl.toFixed(2)} واحد` : "بدون تفاوت (۰.۰)"}
            </span>
          </div>
        </div>

        {/* Interpretation Box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>نکته آموزشی عمیق</span>
          </div>
          <p className="leading-relaxed">
            {t.welfareConclusion}
          </p>
        </div>
      </div>
    </div>
  );
}
