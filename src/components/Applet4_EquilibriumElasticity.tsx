import React, { useState } from "react";
import { locales } from "../locales/fa";
import { Info, Calculator, Scales, Lightbulb } from "@phosphor-icons/react";

export default function Applet4_EquilibriumElasticity() {
  const t = locales.applets.equilibriumElasticity;

  // Sliders state
  const [demandIntercept, setDemandIntercept] = useState(24); // A
  const [supplyIntercept, setSupplyIntercept] = useState(4);   // C
  const [tax, setTax] = useState(4);                           // t

  // Point selection for midpoint elasticity
  const [q1, setQ1] = useState(4);
  const [q2, setQ2] = useState(8);

  // Slopes (fixed for simplicity and visual clarity)
  const B = 1.5; // Demand slope
  const D = 1.0; // Supply slope

  // 1. Solve Equilibrium (No Tax)
  // A - B*Q = C + D*Q => Q = (A-C)/(B+D)
  const qEquil = Math.max(0, (demandIntercept - supplyIntercept) / (B + D));
  const pEquil = demandIntercept - B * qEquil;

  // 2. Solve Equilibrium with Tax
  // A - B*Q_t - (C + D*Q_t) = t => Q_t = (A - C - t)/(B+D)
  const qTax = Math.max(0, (demandIntercept - supplyIntercept - tax) / (B + D));
  const pb = demandIntercept - B * qTax; // Buyer Price
  const ps = supplyIntercept + D * qTax; // Seller Price

  // Surplus math
  const cs = 0.5 * (demandIntercept - pb) * qTax;
  const psurplus = 0.5 * (ps - supplyIntercept) * qTax;
  const govRevenue = tax * qTax;
  const dwl = 0.5 * (qEquil - qTax) * tax;

  // Elasticity calculation
  const p1 = Math.max(0, demandIntercept - B * q1);
  const p2 = Math.max(0, demandIntercept - B * q2);

  const dq = q2 - q1;
  const dp = p2 - p1;
  const qAvg = (q1 + q2) / 2;
  const pAvg = (p1 + p2) / 2;

  let elasticity = 0;
  if (Math.abs(dp) > 0.001 && qAvg > 0.001) {
    elasticity = Math.abs((dq / qAvg) / (dp / pAvg));
  }

  let elasticityLabel = "";
  if (elasticity > 1.02) elasticityLabel = t.elastic;
  else if (elasticity < 0.98) elasticityLabel = t.inelastic;
  else elasticityLabel = t.unitElastic;

  // Tax incidence
  const buyerShare = qTax > 0 ? (pb - pEquil) : 0;
  const sellerShare = qTax > 0 ? (pEquil - ps) : 0;
  const buyerPct = buyerShare + sellerShare > 0 ? (buyerShare / (buyerShare + sellerShare)) * 100 : 50;

  // Plot settings
  const width = 450;
  const height = 300;
  const padding = 45;

  const maxQ = 16;
  const maxP = 30;

  const toSvgX = (q: number) => padding + (q / maxQ) * (width - 2 * padding);
  const toSvgY = (p: number) => height - padding - (p / maxP) * (height - 2 * padding);

  // Clipped coordinates for lines to prevent overflowing outside SVG box
  const qDemandEnd = Math.min(maxQ, (demandIntercept - 2) / B);
  const pDemandEnd = demandIntercept - B * qDemandEnd;

  const qSupplyEnd = Math.min(maxQ, (maxP - supplyIntercept) / D);
  const pSupplyEnd = supplyIntercept + D * qSupplyEnd;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Chart Panel (Left Column) - Wide */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Info className="text-emerald-500" size={20} />
          تعادل عرضه و تقاضا و اثر مالیات
        </h3>

        <div className="relative flex justify-center">
          <svg width={width} height={height} className="overflow-hidden select-none max-w-full">
            {/* Grid lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const qVal = (i + 1) * 3;
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
                    y={toSvgY(pVal) + 3}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {pVal}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Axes */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(maxQ)} y2={toSvgY(0)} stroke="#71717a" strokeWidth={1.5} />
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(0)} y2={toSvgY(maxP)} stroke="#71717a" strokeWidth={1.5} />

            {/* Shaded Area for Surplus and DWL */}
            {tax > 0 && qTax > 0 && (
              <g>
                {/* Consumer Surplus (Red shaded triangle) */}
                <polygon
                  points={`
                    ${toSvgX(0)},${toSvgY(demandIntercept)}
                    ${toSvgX(qTax)},${toSvgY(pb)}
                    ${toSvgX(0)},${toSvgY(pb)}
                  `}
                  fill="#f43f5e"
                  fillOpacity={0.1}
                />
                {/* Producer Surplus (Green shaded triangle) */}
                <polygon
                  points={`
                    ${toSvgX(0)},${toSvgY(supplyIntercept)}
                    ${toSvgX(qTax)},${toSvgY(ps)}
                    ${toSvgX(0)},${toSvgY(ps)}
                  `}
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                {/* Tax Revenue (Blue shaded rectangle) */}
                <rect
                  x={toSvgX(0)}
                  y={toSvgY(pb)}
                  width={toSvgX(qTax) - toSvgX(0)}
                  height={toSvgY(ps) - toSvgY(pb)}
                  fill="#3b82f6"
                  fillOpacity={0.1}
                />
                {/* Deadweight Loss (Yellow shaded triangle) */}
                <polygon
                  points={`
                    ${toSvgX(qTax)},${toSvgY(pb)}
                    ${toSvgX(qTax)},${toSvgY(ps)}
                    ${toSvgX(qEquil)},${toSvgY(pEquil)}
                  `}
                  fill="#eab308"
                  fillOpacity={0.25}
                />
              </g>
            )}

            {/* Demand Curve (D): P = A - B*Q */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(demandIntercept)}
              x2={toSvgX(qDemandEnd)}
              y2={toSvgY(pDemandEnd)}
              stroke="#3b82f6"
              strokeWidth={2.5}
            />

            {/* Supply Curve (S): P = C + D*Q */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(supplyIntercept)}
              x2={toSvgX(qSupplyEnd)}
              y2={toSvgY(pSupplyEnd)}
              stroke="#10b981"
              strokeWidth={2.5}
            />
            {/* Tax lines */}
            {tax > 0 && qTax > 0 && (
              <g>
                {/* Buyer price line */}
                <line
                  x1={toSvgX(0)}
                  y1={toSvgY(pb)}
                  x2={toSvgX(qTax)}
                  y2={toSvgY(pb)}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                />
                {/* Seller price line */}
                <line
                  x1={toSvgX(0)}
                  y1={toSvgY(ps)}
                  x2={toSvgX(qTax)}
                  y2={toSvgY(ps)}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                />
                {/* Quantity Line */}
                <line
                  x1={toSvgX(qTax)}
                  y1={toSvgY(0)}
                  x2={toSvgX(qTax)}
                  y2={toSvgY(pb)}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                />
              </g>
            )}

            {/* No-Tax Equilibrium point */}
            <circle cx={toSvgX(qEquil)} cy={toSvgY(pEquil)} r={4} fill="#6b7280" />

            {/* Axis titles */}
            <text x={toSvgX(maxQ / 2)} y={toSvgY(0) + 26} textAnchor="middle" className="text-[9px] fill-zinc-500 font-medium">مقدار بازار (Q)</text>
            <text x={toSvgX(0) - 24} y={toSvgY(maxP / 2)} textAnchor="middle" transform={`rotate(-90, ${toSvgX(0) - 24}, ${toSvgY(maxP / 2)})`} className="text-[9px] fill-zinc-500 font-medium">قیمت بازار (P)</text>
          </svg>
        </div>
      </div>

      {/* Right Column Stack (Controls & Results) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Scales className="text-blue-500" size={20} />
            تنظیمات بازار و مالیات
          </h3>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.demandShift} (ترجیحات مصرف‌کننده)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{demandIntercept}</span>
              </div>
              <input
                type="range"
                min={15}
                max={30}
                step={1}
                value={demandIntercept}
                onChange={(e) => setDemandIntercept(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.supplyShift} (هزینه‌های تولید)</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{supplyIntercept}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={supplyIntercept}
                onChange={(e) => setSupplyIntercept(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.taxWedge}</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{tax}</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>

          {/* Elasticity Calculator Panel */}
          <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 space-y-4">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
              <Calculator className="text-amber-500" size={16} />
              {t.calcElasticity}
            </h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">{t.point1} Q1</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{q1}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  step={1}
                  value={q1}
                  onChange={(e) => setQ1(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">{t.point2} Q2</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{q2}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  step={1}
                  value={q2}
                  onChange={(e) => setQ2(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.elasticityValue}</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">
                  {elasticity.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">طبقه‌بندی کشش:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{elasticityLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Welfare Metrics Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
            تحلیل رفاهی تعادل بازار
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">قیمت خریدار (Pb):</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{pb.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">قیمت فروشنده (Ps):</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{ps.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">مقدار تعادلی (Q):</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{qTax.toFixed(1)}</span>
            </div>
            <hr className="border-zinc-100 dark:border-zinc-800" />
            <div className="flex justify-between">
              <span className="text-rose-600 font-bold">{t.consumerSurplus}</span>
              <span className="font-mono text-rose-600 font-bold">{cs.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-600 font-bold">{t.producerSurplus}</span>
              <span className="font-mono text-emerald-600 font-bold">{psurplus.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 font-bold">{t.govRevenue}</span>
              <span className="font-mono text-blue-600 font-bold">{govRevenue.toFixed(1)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 text-yellow-600 font-bold">
              <span>{t.deadweightLoss}</span>
              <span className="font-mono font-extrabold">{dwl.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Tax Incidence Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
            {t.taxIncidence}
          </h4>

          <div className="space-y-2 text-xs">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 flex overflow-hidden">
              <div
                style={{ width: `${buyerPct}%` }}
                className="bg-blue-500 h-full"
              ></div>
              <div
                style={{ width: `${100 - buyerPct}%` }}
                className="bg-emerald-500 h-full"
              ></div>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-blue-600 font-bold">خریدار: {buyerPct.toFixed(0)}٪</span>
              <span className="text-emerald-600 font-bold">فروشنده: {(100 - buyerPct).toFixed(0)}٪</span>
            </div>
          </div>
        </div>

        {/* Insight Box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>نکته بار مالیاتی</span>
          </div>
          <p className="leading-relaxed">
            سهم خریدار و فروشنده از پرداخت مالیات بستگی به کشش نسبی منحنی‌های عرضه و تقاضا دارد. هر سمتی که کم‌کشش‌تر باشد، بار مالیاتی بیشتری را تحمل می‌کند.
          </p>
        </div>
      </div>
    </div>
  );
}
