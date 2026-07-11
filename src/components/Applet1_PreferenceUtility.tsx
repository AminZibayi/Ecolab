import React, { useState, useEffect, useRef } from "react";
import { locales } from "../locales/fa";
import { Info, CheckCircle, Warning, Lightbulb } from "@phosphor-icons/react";

interface Point {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

type Relation = "GT" | "LT" | "EQ" | "UNCHECKED";

export default function Applet1_PreferenceUtility() {
  const t = locales.applets.preferenceLab;

  // Draggable points
  const [points, setPoints] = useState<Point[]>([
    { id: "A", name: "A", x: 3, y: 7, color: "#3b82f6" }, // Blue
    { id: "B", name: "B", x: 6, y: 4, color: "#10b981" }, // Green
    { id: "C", name: "C", x: 4, y: 3, color: "#f59e0b" }, // Amber
  ]);

  // Stated relations
  const [rAB, setRAB] = useState<Relation>("UNCHECKED");
  const [rBC, setRBC] = useState<Relation>("UNCHECKED");
  const [rCA, setRCA] = useState<Relation>("UNCHECKED");

  // Behavioral mode
  const [behavioral, setBehavioral] = useState(false);
  const [refPoint] = useState({ x: 5, y: 5 });

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG coordinates mapping
  const width = 400;
  const height = 400;
  const padding = 40;

  const toSvgX = (x: number) => padding + (x / 10) * (width - 2 * padding);
  const toSvgY = (y: number) => height - padding - (y / 10) * (height - 2 * padding);

  const fromSvgX = (svgX: number) => {
    const val = ((svgX - padding) / (width - 2 * padding)) * 10;
    return Math.max(1, Math.min(9, Math.round(val)));
  };

  const fromSvgY = (svgY: number) => {
    const val = ((height - padding - svgY) / (height - 2 * padding)) * 10;
    return Math.max(1, Math.min(9, Math.round(val)));
  };

  // Drag handlers
  const handleMouseDown = (id: string) => {
    setDraggingId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingId || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const xSvg = ((clientX - rect.left) / rect.width) * width;
      const ySvg = ((clientY - rect.top) / rect.height) * height;

      const newX = fromSvgX(xSvg);
      const newY = fromSvgY(ySvg);

      setPoints((prev) =>
        prev.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p))
      );
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [draggingId]);

  // Get current points by ID
  const pA = points.find((p) => p.id === "A")!;
  const pB = points.find((p) => p.id === "B")!;
  const pC = points.find((p) => p.id === "C")!;


  // Check completeness
  const isComplete = rAB !== "UNCHECKED" && rBC !== "UNCHECKED" && rCA !== "UNCHECKED";

  // Preferences analysis
  let isTransitive = true;
  let isMonotonic = true;
  let isConvex = true;
  let cycleMsg = "";
  let monoViolationMsg = "";
  let convexViolationMsg = "";

  if (isComplete) {
    // We map stated choices to a unified preference relation matrix
    // 0 = A, 1 = B, 2 = C
    // pref[i][j]: true if i >= j (i is preferred or indifferent to j)
    // strict[i][j]: true if i > j (i is strictly preferred to j)
    const pref = [
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ];
    const strict = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];

    // Set A vs B
    if (rAB === "GT") {
      pref[0][1] = true;
      strict[0][1] = true;
    } else if (rAB === "LT") {
      pref[1][0] = true;
      strict[1][0] = true;
    } else if (rAB === "EQ") {
      pref[0][1] = true;
      pref[1][0] = true;
    }

    // Set B vs C
    if (rBC === "GT") {
      pref[1][2] = true;
      strict[1][2] = true;
    } else if (rBC === "LT") {
      pref[2][1] = true;
      strict[2][1] = true;
    } else if (rBC === "EQ") {
      pref[1][2] = true;
      pref[2][1] = true;
    }

    // Set C vs A (Note: rCA is selected as C relative to A)
    if (rCA === "GT") {
      pref[2][0] = true;
      strict[2][0] = true;
    } else if (rCA === "LT") {
      pref[0][2] = true;
      strict[0][2] = true;
    } else if (rCA === "EQ") {
      pref[2][0] = true;
      pref[0][2] = true;
    }

    const names = ["A", "B", "C"];

    // 1. Check Transitivity
    // If i >= j and j >= k => i >= k
    // If strict on either => i > k
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          if (pref[i][j] && pref[j][k]) {
            if (!pref[i][k]) {
              isTransitive = false;
              cycleMsg = `${names[i]} ⪰ ${names[j]}، ${names[j]} ⪰ ${names[k]}، اما ${names[k]} ≻ ${names[i]}!`;
            }
            // Strict check
            if ((strict[i][j] || strict[j][k]) && !strict[i][k] && !pref[i][k]) {
              isTransitive = false;
              cycleMsg = `${names[i]} ≻ ${names[j]} ⪰ ${names[k]}، اما ${names[k]} ⪰ ${names[i]}!`;
            }
          }
        }
      }
    }

    // 2. Check Monotonicity
    // If P1 has more of both goods than P2 (at least one strictly more), P1 must be strictly preferred to P2
    const pts = [pA, pB, pC];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        const p1 = pts[i];
        const p2 = pts[j];
        if (p1.x >= p2.x && p1.y >= p2.y && (p1.x > p2.x || p1.y > p2.y)) {
          // p1 strictly dominates p2
          // Thus user must say p1 > p2 (i.e. strict[i][j] must be true, and pref[j][i] must be false)
          if (pref[j][i]) {
            isMonotonic = false;
            monoViolationMsg = `سبد ${names[i]} دارای مقادیر بیشتری از کالاها نسبت به سبد ${names[j]} است (${names[i]}=(${p1.x},${p1.y}) در مقابل ${names[j]}=(${p2.x},${p2.y}))، بنابراین بر اساس اصل یکنوایی باید ${names[i]} ≻ ${names[j]} باشد.`;
          }
        }
      }
    }

    // 3. Check Convexity
    // If P1 ~ P2, then any convex combination (midpoint) should be strictly preferred or indifferent to them.
    // If C is close to the midpoint of A and B, and A ~ B, then C must be preferred or indifferent to A (C >= A).
    // Let's check if there is an indifference relation
    if (rAB === "EQ") {
      // Check if C is a convex combination of A and B
      // To be convex combination, C must lie in the box of A and B, and approximately on the segment.
      const minX = Math.min(pA.x, pB.x);
      const maxX = Math.max(pA.x, pB.x);
      const minY = Math.min(pA.y, pB.y);
      const maxY = Math.max(pA.y, pB.y);

      const isInsideBox = pC.x >= minX && pC.x <= maxX && pC.y >= minY && pC.y <= maxY;
      // C is strictly inside (not equal to endpoints)
      const isNotEndpoint = (pC.x !== pA.x || pC.y !== pA.y) && (pC.x !== pB.x || pC.y !== pB.y);

      if (isInsideBox && isNotEndpoint) {
        // Since A ~ B, convexity requires C >= A.
        // If user says A > C, that violates convexity!
        if (strict[0][2]) {
          isConvex = false;
          convexViolationMsg = `سبد C بین دو سبد بی‌تفاوت A و B قرار دارد. طبق اصل کوژ بودن (محدب بودن ترجیحات)، ترکیب‌های خطی (سبد میانگین C) باید حداقل به اندازه خود آنها مطلوب باشد، اما شما مشخص کرده‌اید A ≻ C.`;
        }
      }
    }
    // Check other pairs for convexity
    if (rBC === "EQ") {
      const minX = Math.min(pB.x, pC.x);
      const maxX = Math.max(pB.x, pC.x);
      const minY = Math.min(pB.y, pC.y);
      const maxY = Math.max(pB.y, pC.y);
      const isInsideBox = pA.x >= minX && pA.x <= maxX && pA.y >= minY && pA.y <= maxY;
      const isNotEndpoint = (pA.x !== pB.x || pA.y !== pB.y) && (pA.x !== pC.x || pA.y !== pC.y);

      if (isInsideBox && isNotEndpoint) {
        if (strict[1][0]) {
          isConvex = false;
          convexViolationMsg = `سبد A بین دو سبد بی‌تفاوت B و C قرار دارد. طبق اصل کوژ بودن، سبد میانگین A باید حداقل به اندازه B مطلوب باشد، اما شما ثبت کرده‌اید B ≻ A.`;
        }
      }
    }
    if (rCA === "EQ") {
      const minX = Math.min(pC.x, pA.x);
      const maxX = Math.max(pC.x, pA.x);
      const minY = Math.min(pC.y, pA.y);
      const maxY = Math.max(pC.y, pA.y);
      const isInsideBox = pB.x >= minX && pB.x <= maxX && pB.y >= minY && pB.y <= maxY;
      const isNotEndpoint = (pB.x !== pC.x || pB.y !== pC.y) && (pB.x !== pA.x || pB.y !== pA.y);

      if (isInsideBox && isNotEndpoint) {
        if (strict[2][1]) {
          isConvex = false;
          convexViolationMsg = `سبد B بین دو سبد بی‌تفاوت C و A قرار دارد. طبق اصل کوژ بودن، سبد میانگین B باید حداقل به اندازه C مطلوب باشد، اما شما ثبت کرده‌اید C ≻ B.`;
        }
      }
    }
  }

  const isRational = isTransitive && isMonotonic && isConvex && isComplete;

  // Indifference curve rendering helper
  // If preferences are rational, let's find a Cobb-Douglas utility parameter r (exponents) that matches the user ranking
  // We want to draw y = U / x^r
  const findRationalExponent = () => {
    if (!isRational) return 1.0;
    // We check which parameter r in [0.2, 5.0] satisfies the user's rankings:
    // We want the utilities U(A), U(B), U(C) calculated as x^r * y to match the sorted order.
    const candidates = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 5.0];
    const statedBetter = (p1: Point, p2: Point) => {
      // Returns 1 if p1 > p2, -1 if p2 > p1, 0 if p1 ~ p2
      if (p1.id === "A" && p2.id === "B") return rAB === "GT" ? 1 : rAB === "LT" ? -1 : 0;
      if (p1.id === "B" && p2.id === "A") return rAB === "LT" ? 1 : rAB === "GT" ? -1 : 0;

      if (p1.id === "B" && p2.id === "C") return rBC === "GT" ? 1 : rBC === "LT" ? -1 : 0;
      if (p1.id === "C" && p2.id === "B") return rBC === "LT" ? 1 : rBC === "GT" ? -1 : 0;

      if (p1.id === "C" && p2.id === "A") return rCA === "GT" ? 1 : rCA === "LT" ? -1 : 0;
      if (p1.id === "A" && p2.id === "C") return rCA === "LT" ? 1 : rCA === "GT" ? -1 : 0;
      return 0;
    };

    for (const r of candidates) {
      const uA = Math.pow(pA.x, r) * pA.y;
      const uB = Math.pow(pB.x, r) * pB.y;
      const uC = Math.pow(pC.x, r) * pC.y;

      const checkPair = (p1: Point, p2: Point, u1: number, u2: number) => {
        const stated = statedBetter(p1, p2);
        if (stated === 1 && u1 <= u2) return false;
        if (stated === -1 && u1 >= u2) return false;
        if (stated === 0 && Math.abs(u1 - u2) > 0.15 * Math.min(u1, u2)) return false;
        return true;
      };

      if (
        checkPair(pA, pB, uA, uB) &&
        checkPair(pB, pC, uB, uC) &&
        checkPair(pC, pA, uC, uA)
      ) {
        return r;
      }
    }
    return 1.0; // Default
  };

  const exponent = findRationalExponent();

  // Helper to generate curve path
  const getCurvePath = (p: Point, r: number) => {
    const u = Math.pow(p.x, r) * p.y;
    let pointsStr = "";
    for (let x = 1; x <= 9.8; x += 0.2) {
      const y = u / Math.pow(x, r);
      if (y >= 0.5 && y <= 9.8) {
        const sx = toSvgX(x);
        const sy = toSvgY(y);
        pointsStr += `${x === 1 ? "M" : "L"} ${sx} ${sy} `;
      }
    }
    return pointsStr;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual Chart Panel */}
      <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Info className="text-blue-500" size={20} />
          نمودار فضای کالاها و سبدهای مصرفی
        </h3>

        <div className="relative flex justify-center">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="overflow-hidden select-none max-w-full"
          >
            {/* Grid lines */}
            {Array.from({ length: 9 }).map((_, i) => {
              const val = i + 1;
              return (
                <React.Fragment key={val}>
                  <line
                    x1={toSvgX(val)}
                    y1={toSvgY(0)}
                    x2={toSvgX(val)}
                    y2={toSvgY(10)}
                    stroke="#e4e4e7"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(val)}
                    x2={toSvgX(10)}
                    y2={toSvgY(val)}
                    stroke="#e4e4e7"
                    className="dark:stroke-zinc-800"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  {/* Axis labels */}
                  <text
                    x={toSvgX(val)}
                    y={toSvgY(0) + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-zinc-500 font-mono"
                  >
                    {val}
                  </text>
                  <text
                    x={toSvgX(0) - 12}
                    y={toSvgY(val) + 4}
                    textAnchor="end"
                    className="text-[10px] fill-zinc-500 font-mono"
                  >
                    {val}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Axes */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(10)}
              y2={toSvgY(0)}
              stroke="#71717a"
              strokeWidth={2}
            />
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(0)}
              y2={toSvgY(10)}
              stroke="#71717a"
              strokeWidth={2}
            />

            {/* Axis titles */}
            <text
              x={toSvgX(5)}
              y={toSvgY(0) + 32}
              textAnchor="middle"
              className="text-xs fill-zinc-700 dark:fill-zinc-300 font-medium"
            >
              {t.goodX}
            </text>
            <text
              x={toSvgX(0) - 28}
              y={toSvgY(5)}
              textAnchor="middle"
              transform={`rotate(-90, ${toSvgX(0) - 28}, ${toSvgY(5)})`}
              className="text-xs fill-zinc-700 dark:fill-zinc-300 font-medium"
            >
              {t.goodY}
            </text>

            {/* Reference point shaded region for loss aversion */}
            {behavioral && (
              <g>
                {/* Quadrants relative to reference point */}
                {/* Loss region: left and below reference point */}
                <rect
                  x={toSvgX(0)}
                  y={toSvgY(10)}
                  width={toSvgX(refPoint.x) - toSvgX(0)}
                  height={toSvgY(0) - toSvgY(refPoint.y)}
                  fill="#ef4444"
                  fillOpacity={0.05}
                />
                <circle
                  cx={toSvgX(refPoint.x)}
                  cy={toSvgY(refPoint.y)}
                  r={5}
                  fill="#ef4444"
                  className="animate-pulse"
                />
                <text
                  x={toSvgX(refPoint.x) + 8}
                  y={toSvgY(refPoint.y) - 8}
                  className="text-[10px] fill-red-600 font-bold"
                >
                  مرجع (۵،۵)
                </text>
              </g>
            )}

            {/* Indifference Curves (only if rational) */}
            {isRational && (
              <g>
                {points.map((p) => (
                  <path
                    key={p.id}
                    d={getCurvePath(p, exponent)}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    opacity={0.8}
                  />
                ))}
              </g>
            )}

            {/* Draggable circles */}
            {points.map((p) => (
              <g key={p.id} className="cursor-grab active:cursor-grabbing">
                <circle
                  cx={toSvgX(p.x)}
                  cy={toSvgY(p.y)}
                  r={draggingId === p.id ? 14 : 10}
                  fill={p.color}
                  className="transition-all duration-75 shadow-sm fill-opacity-90 stroke-white dark:stroke-zinc-950"
                  strokeWidth={2}
                  onMouseDown={() => handleMouseDown(p.id)}
                  onTouchStart={() => handleMouseDown(p.id)}
                />
                <text
                  x={toSvgX(p.x)}
                  y={toSvgY(p.y) - 14}
                  textAnchor="middle"
                  className="text-xs font-extrabold fill-zinc-800 dark:fill-zinc-200 select-none font-mono"
                >
                  {p.name} ({p.x}, {p.y})
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-4 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900">
          <strong>راهنمای تعامل:</strong> دایره‌های رنگی A و B و C را با کشیدن و رها کردن در صفحه مختصات کالاها حرکت دهید. مختصات آن‌ها به صورت هوشمند گرد می‌شوند.
        </div>
      </div>

      {/* Relations Form & Feedback Panel */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={20} />
            تعیین رابطه ترجیح بین گزینه‌ها
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {t.instructions}
          </p>

          {/* Relation Selectors */}
          <div className="space-y-4">
            {/* Pair AB */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-900">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد A</strong>
              </span>
              <select
                value={rAB}
                onChange={(e) => setRAB(e.target.value as Relation)}
                className="w-full sm:w-auto text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-center"
              >
                <option value="UNCHECKED">مقایسه نشده</option>
                <option value="GT">ترجیح دارد بر B (A ≻ B)</option>
                <option value="LT">ترجیح دارد بر A (B ≻ A)</option>
                <option value="EQ">بی‌تفاوت با B (A ∼ B)</option>
              </select>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد B</strong>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>

            {/* Pair BC */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-900">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد B</strong>
              </span>
              <select
                value={rBC}
                onChange={(e) => setRBC(e.target.value as Relation)}
                className="w-full sm:w-auto text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-center"
              >
                <option value="UNCHECKED">مقایسه نشده</option>
                <option value="GT">ترجیح دارد بر C (B ≻ C)</option>
                <option value="LT">ترجیح دارد بر B (C ≻ B)</option>
                <option value="EQ">بی‌تفاوت با C (B ∼ C)</option>
              </select>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد C</strong>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              </span>
            </div>

            {/* Pair CA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-900">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد C</strong>
              </span>
              <select
                value={rCA}
                onChange={(e) => setRCA(e.target.value as Relation)}
                className="w-full sm:w-auto text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-center"
              >
                <option value="UNCHECKED">مقایسه نشده</option>
                <option value="GT">ترجیح دارد بر A (C ≻ A)</option>
                <option value="LT">ترجیح دارد بر C (A ≻ C)</option>
                <option value="EQ">بی‌تفاوت با A (C ∼ A)</option>
              </select>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">سبد A</strong>
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {t.rationalityStatus}
          </h3>

          {!isComplete ? (
            <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-100 dark:border-zinc-900 text-sm">
              <Info className="text-blue-500 flex-shrink-0" size={20} />
              <div>
                <strong>نامکمل بودن ترجیحات:</strong>
                <p className="mt-1">لطفاً برای فعال‌سازی موتور تحلیل، رابطه بین تمامی سبدها را تعیین کنید.</p>
              </div>
            </div>
          ) : isRational ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-900/50 text-sm">
                <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
                <div>
                  <strong className="font-bold">ترجیحات عقلانی و سازگار:</strong>
                  <p className="mt-1">{t.rational}</p>
                  <p className="mt-1 text-xs opacity-80">
                    رابطه ترجیحات مشخص‌شده قابل شبیه‌سازی با تابع مطلوبیت $u(x, y) = x^{exponent.toFixed(1)} \cdot y$ است.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-100 dark:border-rose-900/50 text-sm">
                <Warning className="text-rose-500 flex-shrink-0" size={20} />
                <div>
                  <strong className="font-bold">تناقض و نقض فرض‌های عقلانیت:</strong>
                  <p className="mt-1">{t.irrational}</p>
                </div>
              </div>

              {/* Show which axioms failed */}
              <div className="space-y-2 text-xs">
                {!isTransitive && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <span className="font-bold text-red-600 dark:text-red-400">نقض اصل انتقال‌پذیری (تراگذری):</span>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{cycleMsg}</p>
                  </div>
                )}
                {!isMonotonic && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <span className="font-bold text-red-600 dark:text-red-400">نقض اصل یکنوایی (Monotonicity):</span>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{monoViolationMsg}</p>
                  </div>
                )}
                {!isConvex && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <span className="font-bold text-red-600 dark:text-red-400">نقض اصل کوژ بودن (Convexity):</span>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{convexViolationMsg}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Axioms verification table */}
          {isComplete && (
            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-4 overflow-x-auto">
              <table className="min-w-full text-xs text-zinc-700 dark:text-zinc-300 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 text-start font-bold">اصل عقلانیت</th>
                    <th className="py-2 text-center font-bold">وضعیت برقراری</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2">{t.completeness}</td>
                    <td className="py-2 text-center text-emerald-600 dark:text-emerald-400 font-bold">+</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2">{t.transitivity}</td>
                    <td className={`py-2 text-center font-bold ${isTransitive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isTransitive ? "+" : "−"}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2">{t.monotonicity}</td>
                    <td className={`py-2 text-center font-bold ${isMonotonic ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isMonotonic ? "+" : "−"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">{t.convexity}</td>
                    <td className={`py-2 text-center font-bold ${isConvex ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isConvex ? "+" : "−"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}


          {/* Behavioral mode toggler */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={behavioral}
                onChange={(e) => setBehavioral(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-zinc-300 dark:border-zinc-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.behavioralMode}
              </span>
            </label>
            {behavioral && (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                {t.framingText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
