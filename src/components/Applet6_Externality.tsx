import React, { useState } from "react";
import { locales } from "../locales/fa";
import { Info, Scales, Lightbulb } from "@phosphor-icons/react";

type PolicyType = "FREE_MARKET" | "PIGOUVIAN_TAX" | "CAP_AND_TRADE";

export default function Applet6_Externality() {
  const t = locales.applets.externality;

  // Sliders state
  const [externality, setExternality] = useState(6); // E (damage size)
  const [policy, setPolicy] = useState<PolicyType>("FREE_MARKET");
  const [cap, setCap] = useState(6);                 // Quota cap for Cap & Trade

  // Market equations parameters
  const A = 24;  // Demand (MSB) intercept
  const B = 1.5; // Demand slope
  const C = 4;   // Private cost (MPC) intercept
  const D = 1.0; // Private cost slope

  // 1. Free Market Equilibrium (MPC = MSB)
  // A - B*Q = C + D*Q => Qm = (A-C)/(B+D)
  const qMarket = (A - C) / (B + D);
  const pMarket = A - B * qMarket;

  // 2. Social Optimum (MSC = MSB)
  // MSC = C + E + D*Q
  // A - B*Q = C + E + D*Q => Qs = (A-C-E)/(B+D)
  const qOpt = Math.max(0, (A - C - externality) / (B + D));
  const pOpt = A - B * qOpt;

  // Current production based on policy
  let qCurrent = qMarket;
  let pb = pMarket; // Buyer price
  let ps = pMarket; // Seller price

  if (policy === "PIGOUVIAN_TAX") {
    // Tax t = E shifts supply to MSC, so output is Qs
    qCurrent = qOpt;
    pb = A - B * qCurrent;
    ps = pb - externality; // Seller receives price minus tax
  } else if (policy === "CAP_AND_TRADE") {
    // Quota cap restricts quantity
    qCurrent = Math.min(qMarket, cap);
    pb = A - B * qCurrent;
    ps = C + D * qCurrent;
  }

  // Permit price in market: difference between demand price (pb) and private marginal cost (ps)
  const permitPrice = Math.max(0, pb - ps);

  // Deadweight loss calculations
  // DWL is the integral of (MSC - MSB) from Q_current to Q_market (if Q_current = Q_opt, DWL = 0)
  // Specifically: DWL = 0.5 * (qCurrent - qOpt)^2 * (B + D)
  const dwl = 0.5 * Math.pow(qCurrent - qOpt, 2) * (B + D);

  // Plot settings
  const width = 400;
  const height = 300;
  const padding = 45;

  const maxQ = 12;
  const maxP = 30;

  const toSvgX = (q: number) => padding + (q / maxQ) * (width - 2 * padding);
  const toSvgY = (p: number) => height - padding - (p / maxP) * (height - 2 * padding);

  // Clipped coordinates for lines to prevent overflowing outside SVG box
  const qDemandEnd = Math.min(maxQ, (A - 2) / B);
  const pDemandEnd = A - B * qDemandEnd;

  const qSupplyEnd = Math.min(maxQ, (maxP - C) / D);
  const pSupplyEnd = C + D * qSupplyEnd;

  const qMscEnd = Math.min(maxQ, (maxP - C - externality) / D);
  const pMscEnd = C + externality + D * qMscEnd;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Controls Panel */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Scales className="text-blue-500" size={20} />
          تنظیمات آثار خارجی و سیاست‌گذاری
        </h3>

        {/* Policy Selector */}
        <div>
          <label className="text-xs font-bold text-zinc-500 block mb-2">نوع سیاست حمایتی:</label>
          <div className="grid grid-cols-1 gap-2">
            {(["FREE_MARKET", "PIGOUVIAN_TAX", "CAP_AND_TRADE"] as PolicyType[]).map((pType) => (
              <button
                key={pType}
                onClick={() => setPolicy(pType)}
                className={`text-xs py-2.5 px-3 rounded-lg border font-bold transition-all text-right flex justify-between items-center ${
                  policy === pType
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600"
                }`}
              >
                <span>
                  {pType === "FREE_MARKET" && t.freeMarket}
                  {pType === "PIGOUVIAN_TAX" && t.pigouvianTax}
                  {pType === "CAP_AND_TRADE" && t.capAndTrade}
                </span>
                <span className="text-[10px] opacity-75 font-normal">
                  {pType === "FREE_MARKET" && "تولید تعادلی بازار"}
                  {pType === "PIGOUVIAN_TAX" && "وضع مالیات برابر آسیب"}
                  {pType === "CAP_AND_TRADE" && "سهمیه‌بندی و خرید مجوز"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">{t.externalitySize} (E)</span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">{externality}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={externality}
              onChange={(e) => {
                const val = Number(e.target.value);
                setExternality(val);
                // Sync default cap to social optimum initially
                const autoCap = (A - C - val) / (B + D);
                setCap(Math.round(autoCap * 10) / 10);
              }}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {policy === "CAP_AND_TRADE" && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">سقف مجاز انتشار آلودگی (Quota Cap):</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cap}</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Market Graph Panel */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Info className="text-emerald-500" size={20} />
          نمودار عرضه، تقاضا و آلودگی بازار
        </h3>

        <div className="relative flex justify-center">
          <svg width={width} height={height} className="overflow-hidden select-none max-w-full">
            {/* Grid background lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const qVal = (i + 1) * 2.5;
              const pVal = (i + 1) * 6;
              return (
                <React.Fragment key={i}>
                  <line
                    x1={toSvgX(qVal)}
                    y1={toSvgY(0)}
                    x2={toSvgX(qVal)}
                    y2={toSvgY(maxP)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(pVal)}
                    x2={toSvgX(maxQ)}
                    y2={toSvgY(pVal)}
                    stroke="#f4f4f5"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            })}

            {/* Axes */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(maxQ)} y2={toSvgY(0)} stroke="#71717a" strokeWidth={1.5} />
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(maxP)} stroke="#71717a" strokeWidth={1.5} />

            {/* Shaded Deadweight Loss area */}
            {dwl > 0.01 && (
              <polygon
                points={`
                  ${toSvgX(qCurrent)},${toSvgY(pb)}
                  ${toSvgX(qCurrent)},${toSvgY(C + D * qCurrent + externality)}
                  ${toSvgX(qMarket)},${toSvgY(pMarket)}
                `}
                fill="#f43f5e"
                fillOpacity={0.2}
              />
            )}

            {/* Demand / MSB curve */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(A)}
              x2={toSvgX(qDemandEnd)}
              y2={toSvgY(pDemandEnd)}
              stroke="#3b82f6"
              strokeWidth={2.5}
            />

            {/* Supply / MPC curve */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(C)}
              x2={toSvgX(qSupplyEnd)}
              y2={toSvgY(pSupplyEnd)}
              stroke="#10b981"
              strokeWidth={2.5}
            />

            {/* Social Cost / MSC curve */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(C + externality)}
              x2={toSvgX(qMscEnd)}
              y2={toSvgY(pMscEnd)}
              stroke="#b91c1c"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* Equilibrium Markers */}
            {/* Free Market */}
            <circle cx={toSvgX(qMarket)} cy={toSvgY(pMarket)} r={4} fill="#6b7280" />
            {/* Social Optimum */}
            <circle cx={toSvgX(qOpt)} cy={toSvgY(pOpt)} r={4} fill="#b91c1c" />

            {/* Current point */}
            <circle cx={toSvgX(qCurrent)} cy={toSvgY(pb)} r={6} fill="#3b82f6" stroke="white" strokeWidth={2} />

            {/* Axis titles */}
            <text x={toSvgX(maxQ / 2)} y={toSvgY(0) + 26} textAnchor="middle" className="text-[9px] fill-zinc-500">مقدار تولید (Q)</text>
            <text x={toSvgX(0) - 24} y={toSvgY(maxP / 2)} textAnchor="middle" transform={`rotate(-90, ${toSvgX(0) - 24}, ${toSvgY(maxP / 2)})`} className="text-[9px] fill-zinc-500">قیمت (P)</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.msb} (تقاضا)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.mpc} (عرضه)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-dashed border-red-600 rounded-full"></span>
            <span className="text-zinc-500 font-bold">{t.msc} (هزینه با آلودگی)</span>
          </div>
        </div>
      </div>

      {/* Policy Results / Analysis Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Policy status report */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
            نتایج سیاست حمایتی
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">{t.marketPrice}</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{pb.toFixed(1)} واحد</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t.marketQty}</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{qCurrent.toFixed(1)} واحد</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 font-medium">
              <span className="text-zinc-500">{t.deadweightLoss}</span>
              <span className={`font-mono font-bold ${dwl > 0.05 ? "text-red-500" : "text-emerald-500"}`}>
                {dwl.toFixed(2)}
              </span>
            </div>

            {policy === "CAP_AND_TRADE" && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg mt-2">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 block mb-1">
                  {t.permitPrice}
                </span>
                <span className="font-mono text-sm font-extrabold text-blue-800 dark:text-blue-300">
                  {permitPrice.toFixed(1)} واحد
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Insight Box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>بینش آثار خارجی</span>
          </div>
          <p className="leading-relaxed">
            در تعادل بازار آزاد، تولیدکننده هزینه آلودگی (E) را در محاسبات خود لحاظ نمی‌کند که منجر به تولید بیش از حد بهینه اجتماعی می‌شود.
          </p>
          <p className="leading-relaxed mt-2">
            دقت کنید که قیمت مجوزها در بازار رقابتی دقیقا معادل نرخ مطلوب مالیات پیگویی (E) در صورتی است که سقف تولید به درستی تنظیم شده باشد.
          </p>
        </div>
      </div>
    </div>
  );
}
