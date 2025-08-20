import {
  SummaryCard,
  ProductList,
  StatRow
} from "../components";

import {
  SUMMARY_CARD_BG,
  VALUE_COLORS
} from "../../../constants/colors";

import {
  formatCurrency,
  formatPercentage
} from "../../../utils/formatters";

import {
    reportData,
    top10ProfitUsdData,
    top10ProfitPctData,
    bottom10ProfitUsdData
} from "src."

  <div>
    <h3 className="text-xl font-semibold text-gray-800 mb-6">
      ملخص شامل للأرباح
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">

        <SummaryCard title="إحصائيات الأرباح" bgColorClass={SUMMARY_CARD_BG.stats}>
          <div className="space-y-3">
            <StatRow label="متوسط الربح:" value={formatCurrency(reportData.summary.avg_profit_usd)} />
            <StatRow label="متوسط نسبة الربح:" value={`${reportData.summary.avg_profit_pct.toFixed(1)}%`} />
            <StatRow label="أعلى ربح:" value={<span className={VALUE_COLORS.positive}>{formatCurrency(reportData.summary.max_profit_usd)}</span>} />
            <StatRow label="أقل ربح:" value={<span className={VALUE_COLORS.negative}>{formatCurrency(reportData.summary.min_profit_usd)}</span>} />
          </div>
        </SummaryCard>

        <SummaryCard title="أفضل 3 منتجات (الربح $)" bgColorClass={SUMMARY_CARD_BG.topProfitUsd}>
          <ProductList
            data={top10ProfitUsdData}
            valueFormatter={(p) => formatCurrency(p.profit_usd!)}
          />
        </SummaryCard>
      </div>

      <div className="space-y-6">
        <SummaryCard title="أفضل 3 منتجات (نسبة الربح %)" bgColorClass={SUMMARY_CARD_BG.topProfitPct}>
          <ProductList
            data={top10ProfitPctData}
            valueFormatter={(p) => formatPercentage(p.profit_percentage!)}
          />
        </SummaryCard>

        <SummaryCard title="المنتجات التي تحتاج مراجعة" bgColorClass={SUMMARY_CARD_BG.reviewNeeded}>
          <ProductList
            data={bottom10ProfitUsdData}
            valueFormatter={(p) => formatCurrency(p.profit_usd!)}
            showRank={false}
            valueColor="negative"
          />
        </SummaryCard>
      </div>
    </div>
  </div>

