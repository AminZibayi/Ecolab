import React, { useState } from "react";
import { locales } from "../locales/fa";
import { ChartLine, Factory, Lightbulb } from "@phosphor-icons/react";

export default function Applet3_ProductionCost() {
  const t = locales.applets.productionCost;

  // Sliders state
  const [wage, setWage] = useState(5);
  const [rental, setRental] = useState(5);
  const [z, setZ] = useState(2); // productivity z
  const [alpha, setAlpha] = useState(0.5); // K exponent
  const [beta, setBeta] = useState(0.5);  // L exponent
  const [fixedK, setFixedK] = useState(4); // Short-run fixed K

  // RTS calculation
  const sumCoeff = alpha + beta;
  let rtsText = "";
  if (Math.abs(sumCoeff - 1.0) < 0.01) {
    rtsText = `${t.constantRTS} (α + β = ${sumCoeff.toFixed(1)})`;
  } else if (sumCoeff > 1.0) {
    rtsText = `${t.increasingRTS} (α + β = ${sumCoeff.toFixed(1)})`;
  } else {
    rtsText = `${t.decreasingRTS} (α + β = ${sumCoeff.toFixed(1)})`;
  }

  // Cost curve math for a given quantity q
  const getCosts = (q: number) => {
    const denom = z * Math.pow(fixedK, alpha);
    const L = Math.pow(q / denom, 1 / beta);
    const FC = rental * fixedK;
    const VC = wage * L;
    const TC = FC + VC;
    const AC = TC / q;
    const MC = (wage * L) / (beta * q);
    const AVC = VC / q;
    return { FC, VC, TC, AC, MC, AVC };
  };

  // Plot settings
  const width = 450;
  const height = 300;
  const padding = 45;

  const maxQ = 10;
  const maxC = 30; // max cost value for scale

  const toSvgX = (q: number) => padding + (q / maxQ) * (width - 2 * padding);
  const toSvgY = (c: number) => height - padding - (c / maxC) * (height - 2 * padding);

  // Generate paths for AC, MC, AVC
  const getCurvePath = (type: "AC" | "MC" | "AVC") => {
    let path = "";
    let first = true;
    for (let q = 0.5; q <= maxQ; q += 0.25) {
      const costs = getCosts(q);
      let val = 0;
      if (type === "AC") val = costs.AC;
      else if (type === "MC") val = costs.MC;
      else if (type === "AVC") val = costs.AVC;

      if (val >= 0 && val <= maxC) {
        const sx = toSvgX(q);
        const sy = toSvgY(val);
        path += `${first ? "M" : "L"} ${sx} ${sy} `;
        first = false;
      }
    }
    return path;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Curves Graph Panel (Wide) */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <ChartLine className="text-emerald-500" size={20} />
          {t.shortRunCost}
        </h3>

        <div className="relative flex justify-center">
          <svg width={width} height={height} className="overflow-hidden select-none max-w-full">
            {/* Grid lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const qVal = (i + 1) * 2;
              const cVal = (i + 1) * 6;
              return (
                <React.Fragment key={i}>
                  <line
                    x1={toSvgX(qVal)}
                    y1={toSvgY(0)}
                    x2={toSvgX(qVal)}
                    y2={toSvgY(maxC)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(cVal)}
                    x2={toSvgX(maxQ)}
                    y2={toSvgY(cVal)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                  <text
                    x={toSvgX(qVal)}
                    y={toSvgY(0) + 14}
                    textAnchor="middle"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {qVal}
                  </text>
                  <text
                    x={toSvgX(0) - 8}
                    y={toSvgY(cVal) + 3}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {cVal}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Axes */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(maxQ)} y2={toSvgY(0)} stroke="#71717a" strokeWidth={1.5} />
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(maxC)} stroke="#71717a" strokeWidth={1.5} />

            {/* AC, MC, AVC curves */}
            <path d={getCurvePath("AC")} fill="none" stroke="#ef4444" strokeWidth={2.5} />
            <path d={getCurvePath("MC")} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
            <path d={getCurvePath("AVC")} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" />

            {/* Axis titles */}
            <text x={toSvgX(maxQ / 2)} y={toSvgY(0) + 28} textAnchor="middle" className="text-[10px] fill-zinc-500 font-medium">مقدار تولید (q)</text>
            <text x={toSvgX(0) - 26} y={toSvgY(maxC / 2)} textAnchor="middle" transform={`rotate(-90, ${toSvgX(0) - 26}, ${toSvgY(maxC / 2)})`} className="text-[10px] fill-zinc-500 font-medium">هزینه (واحد پولی)</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.legendAC}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.legendMC}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-dashed border-amber-500 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.legendAVC}</span>
          </div>
        </div>
      </div>

      {/* Right Column Stack (Controls & Results) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Factory className="text-blue-500" size={20} />
            تنظیمات تکنولوژی و قیمت عوامل تولید
          </h3>
          <div className="space-y-4">
            {/* Productivity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.tech} (z)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{z}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={z}
                onChange={(e) => setZ(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Exponents alpha and beta */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.alpha} (α)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{alpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.8}
                step={0.05}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.beta} (β)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.8}
                step={0.05}
                value={beta}
                onChange={(e) => setBeta(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.wage} (w)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{wage}</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={wage}
                onChange={(e) => setWage(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.rental} (r)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{rental}</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={rental}
                onChange={(e) => setRental(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Fixed Capital */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.capital} در کوتاه‌مدت (K̄)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{fixedK}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={fixedK}
                onChange={(e) => setFixedK(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Info panel */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-xl space-y-2">
            <div className="text-xs font-bold text-zinc-500">{t.returnsToScale}</div>
            <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{rtsText}</div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              اگر مجموع کشش‌ها برابر ۱ باشد بازدهی ثابت، بزرگتر از ۱ بازدهی فزاینده و کوچکتر از ۱ بازدهی کاهنده به مقیاس نام دارد.
            </p>
          </div>
        </div>

        {/* Value metrics display */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
            هزینه‌های بنگاه در تولید q=۵
          </h4>

          {(() => {
            const costs = getCosts(5);
            return (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">کل هزینه ثابت (FC):</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{costs.FC.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">کل هزینه متغیر (VC):</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{costs.VC.toFixed(1)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 font-bold text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">کل هزینه (TC):</span>
                  <span className="font-mono text-zinc-950 dark:text-zinc-50">{costs.TC.toFixed(1)}</span>
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800" />
                <div className="flex justify-between font-medium">
                  <span className="text-red-500">{t.legendAC}</span>
                  <span className="font-mono text-red-600 dark:text-red-400 font-bold">{costs.AC.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-blue-500">{t.legendMC}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{costs.MC.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Education Insight */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>شهود اقتصادی منحنی‌ها</span>
          </div>
          <p className="leading-relaxed">
            دقت کنید که منحنی هزینه نهایی (MC) همواره منحنی هزینه متوسط (AC) را در نقطه کمینه آن قطع می‌کند.
          </p>
          <p className="leading-relaxed mt-2">
            وقتی کشش کارایی نیروی کار (β) را کاهش دهید، بازدهی تولید با شدت بیشتری نزولی می‌شود و در نتیجه هزینه نهایی با سرعت بیشتری صعودی می‌گردد.
          </p>
        </div>
      </div>
    </div>
  );
}
