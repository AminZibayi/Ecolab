import { useState } from "react";
import { locales } from "../locales/fa";
import { Info, Warning, CheckCircle, Lightbulb } from "@phosphor-icons/react";

export default function Applet7_LemonMarket() {
  const t = locales.applets.lemonMarket;

  // Sliders state
  const [pLemons, setPLemons] = useState(0.4); // fraction of lemons
  const [vbg, setVbg] = useState(100);        // buyer value good
  const [vbb, setVbb] = useState(40);         // buyer value bad
  const [vsg, setVsg] = useState(80);         // seller value good
  const [vsb, setVsb] = useState(30);         // seller value bad

  // Expected value that buyer is willing to bid under asymmetric information
  const ev = (1 - pLemons) * vbg + pLemons * vbb;

  // Market unraveling logic
  let marketStatus: "ACTIVE" | "PARTIAL_COLLAPSE" | "FULL_COLLAPSE" = "ACTIVE";
  let statusText = "";
  let statusColor = "";

  if (ev >= vsg) {
    marketStatus = "ACTIVE";
    statusText = t.marketActive;
    statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50";
  } else if (ev >= vsb) {
    marketStatus = "PARTIAL_COLLAPSE";
    statusText = t.marketCollapsed;
    statusColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50";
  } else {
    marketStatus = "FULL_COLLAPSE";
    statusText = "فروپاشی کامل بازار! قیمت پیشنهادی حتی کمتر از ارزش خودروهای بی‌کیفیت برای فروشندگان است و هیچ معامله‌ای انجام نمی‌شود.";
    statusColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50";
  }

  // Plot variables
  const width = 450;
  const height = 240;
  const padding = 40;

  const maxVal = 160;

  const toSvgX = (v: number) => padding + (v / maxVal) * (width - 2 * padding);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual Chart Panel (Left Column) - Wide */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Info className="text-emerald-500" size={20} />
          شبیه‌سازی قیمت انتظاری و فروپاشی بازار
        </h3>

        <div className="relative flex justify-center">
          <svg width={width} height={height} className="overflow-hidden select-none max-w-full">
            {/* Value scale ticks */}
            {[40, 80, 120, 160].map((val) => (
              <g key={val}>
                <line
                  x1={toSvgX(val)}
                  y1={height - padding}
                  x2={toSvgX(val)}
                  y2={padding}
                  stroke="#f4f4f5"
                  className="dark:stroke-zinc-800"
                  strokeWidth={1}
                />
                <text
                  x={toSvgX(val)}
                  y={height - padding + 15}
                  textAnchor="middle"
                  className="text-[9px] fill-zinc-400 font-mono"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Bottom Axis line */}
            <line
              x1={toSvgX(0)}
              y1={height - padding}
              x2={toSvgX(maxVal)}
              y2={height - padding}
              stroke="#71717a"
              strokeWidth={1.5}
            />

            {/* Seller Reservation values */}
            {/* Good car seller value */}
            <rect
              x={toSvgX(0)}
              y={padding + 10}
              width={toSvgX(vsg) - toSvgX(0)}
              height={14}
              fill="#10b981"
              fillOpacity={0.15}
              rx={3}
            />
            <text x={toSvgX(vsg) + 6} y={padding + 21} className="text-[10px] fill-emerald-700 dark:fill-emerald-400 font-bold">
              فروشنده خوب: {vsg}
            </text>

            {/* Bad car seller value */}
            <rect
              x={toSvgX(0)}
              y={padding + 34}
              width={toSvgX(vsb) - toSvgX(0)}
              height={14}
              fill="#10b981"
              fillOpacity={0.15}
              rx={3}
            />
            <text x={toSvgX(vsb) + 6} y={padding + 45} className="text-[10px] fill-emerald-700 dark:fill-emerald-400 font-bold">
              فروشنده لیمو: {vsb}
            </text>

            {/* Buyer valuations */}
            {/* Good car buyer value */}
            <rect
              x={toSvgX(0)}
              y={padding + 64}
              width={toSvgX(vbg) - toSvgX(0)}
              height={14}
              fill="#3b82f6"
              fillOpacity={0.15}
              rx={3}
            />
            <text x={toSvgX(vbg) + 6} y={padding + 75} className="text-[10px] fill-blue-700 dark:fill-blue-400 font-bold">
              خریدار خوب: {vbg}
            </text>

            {/* Bad car buyer value */}
            <rect
              x={toSvgX(0)}
              y={padding + 88}
              width={toSvgX(vbb) - toSvgX(0)}
              height={14}
              fill="#3b82f6"
              fillOpacity={0.15}
              rx={3}
            />
            <text x={toSvgX(vbb) + 6} y={padding + 99} className="text-[10px] fill-blue-700 dark:fill-blue-400 font-bold">
              خریدار لیمو: {vbb}
            </text>

            {/* Expected value line (Willingness to Pay) */}
            <line
              x1={toSvgX(ev)}
              y1={padding - 5}
              x2={toSvgX(ev)}
              y2={height - padding}
              stroke="#eab308"
              strokeWidth={3}
              strokeDasharray="3 3"
            />
            <text
              x={toSvgX(ev)}
              y={padding - 10}
              textAnchor="middle"
              className="text-[11px] font-extrabold fill-yellow-600 dark:fill-yellow-400"
            >
              ارزش انتظاری: {ev.toFixed(0)}
            </text>
          </svg>
        </div>
      </div>

      {/* Right Column Stack (Controls & Results) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Info className="text-blue-500" size={20} />
            پارامترهای بازار خودرو دست‌دوم
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">{t.pctLemons}</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{(pLemons * 100).toFixed(0)}٪</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={pLemons}
                onChange={(e) => setPLemons(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-zinc-500">ارزش‌گذاری خریداران (ارزش نهایی):</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">خوب (هلو)</span>
                    <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{vbg}</span>
                  </div>
                  <input
                    type="range"
                    min={vsg}
                    max={150}
                    step={5}
                    value={vbg}
                    onChange={(e) => setVbg(Math.max(vsg, Number(e.target.value)))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">بد (لیمو)</span>
                    <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{vbb}</span>
                  </div>
                  <input
                    type="range"
                    min={vsb}
                    max={80}
                    step={5}
                    value={vbb}
                    onChange={(e) => setVbb(Math.max(vsb, Number(e.target.value)))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-zinc-500">حداقل قیمت فروشندگان (قیمت رزرو):</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">خوب (هلو)</span>
                    <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{vsg}</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={vbg}
                    step={5}
                    value={vsg}
                    onChange={(e) => setVsg(Math.min(vbg, Number(e.target.value)))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">بد (لیمو)</span>
                    <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50">{vsb}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={vbb}
                    step={5}
                    value={vsb}
                    onChange={(e) => setVsb(Math.min(vbb, Number(e.target.value)))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Status Card */}
        <div className={`border rounded-xl p-5 shadow-sm space-y-4 ${statusColor}`}>
          <div className="flex items-center gap-2">
            {marketStatus === "ACTIVE" ? (
              <CheckCircle size={24} />
            ) : (
              <Warning size={24} />
            )}
            <h4 className="font-extrabold text-sm">
              وضعیت تعادل بازار
            </h4>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {statusText}
          </p>
        </div>

        {/* Math report */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
            تحلیل تقارن اطلاعاتی
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">{t.expectedValue}</span>
              <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">
                {ev.toFixed(1)} واحد
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">حداقل قیمت درخواستی خودرو خوب:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{vsg} واحد</span>
            </div>
            <hr className="border-zinc-100 dark:border-zinc-800" />
            <div className="flex justify-between font-bold text-[10px]">
              <span className="text-zinc-600">شرط خروج خودرو خوب:</span>
              <span className={ev < vsg ? "text-red-500" : "text-emerald-500"}>
                {ev < vsg ? "برقرار است (خروج)" : "خیر (معامله)"}
              </span>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <Lightbulb className="text-amber-500" size={16} />
            <span>نکته کژگزینی</span>
          </div>
          <p className="leading-relaxed">
            کژگزینی (Adverse Selection) زمانی رخ می‌دهد که عدم تقارن اطلاعاتی قبل از معامله باعث شود خریدار قیمت انتظاری پایینی پیشنهاد دهد، در نتیجه دارندگان کالای باکیفیت بازار را ترک کنند و فقط کالای بی‌کیفیت (لیمو) مبادله شود.
          </p>
        </div>
      </div>
    </div>
  );
}
