import { Request, Response } from 'express';
import { db } from '../config/database.js';

export async function getSummaryStats(req: Request, res: Response) {
  try {
    // 1. Overall counts
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total_tests,
        SUM(CASE WHEN test_result = 'PASS' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN test_result = 'FAIL' THEN 1 ELSE 0 END) as fail_count
      FROM test_logs
    `).get() as { total_tests: number; pass_count: number; fail_count: number };

    const totalTests = overall.total_tests || 0;
    const passCount = overall.pass_count || 0;
    const failCount = overall.fail_count || 0;
    const passRate = totalTests > 0 ? Number(((passCount / totalTests) * 100).toFixed(1)) : 0;
    const defectRate = totalTests > 0 ? Number(((failCount / totalTests) * 100).toFixed(1)) : 0;

    // 2. Today's metrics
    const todayMetrics = db.prepare(`
      SELECT 
        COUNT(*) as today_total,
        SUM(CASE WHEN test_result = 'PASS' THEN 1 ELSE 0 END) as today_pass,
        SUM(CASE WHEN test_result = 'FAIL' THEN 1 ELSE 0 END) as today_fail
      FROM test_logs
      WHERE date(tested_at) = date('now')
    `).get() as { today_total: number; today_pass: number; today_fail: number };

    // 3. Failure reasons breakdown (Donut / Pie chart)
    const failureReasons = db.prepare(`
      SELECT 
        COALESCE(failure_reason, 'UNKNOWN') as reason,
        COUNT(*) as count
      FROM test_logs
      WHERE test_result = 'FAIL'
      GROUP BY reason
      ORDER BY count DESC
    `).all() as Array<{ reason: string; count: number }>;

    // Friendly localized titles for reasons
    const reasonLabels: Record<string, string> = {
      'NO_HARDWARE_DETECTED': 'Аппаратный сбой (нет контакта CD/ca0)',
      'AUTH_KEY_EXCHANGE_FAILED': 'Ошибка ключей SAC / сертификата CI+',
      'AUTH_TIMEOUT': 'Таймаут шины APDU (>15 сек)',
      'ADB_COMMUNICATION_ERROR': 'Сбой связи по ADB с ТВ',
      'UNKNOWN': 'Прочие дефекты'
    };

    const formattedFailureReasons = failureReasons.map(item => ({
      key: item.reason,
      name: reasonLabels[item.reason] || item.reason,
      count: item.count,
      percentage: failCount > 0 ? Number(((item.count / failCount) * 100).toFixed(1)) : 0
    }));

    // 4. Trend dynamics (e.g. grouped by hour/day for AreaChart)
    const trendRows = db.prepare(`
      SELECT 
        strftime('%m-%d %H:00', tested_at) as time_label,
        COUNT(*) as total,
        SUM(CASE WHEN test_result = 'PASS' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN test_result = 'FAIL' THEN 1 ELSE 0 END) as fail
      FROM test_logs
      GROUP BY time_label
      ORDER BY time_label ASC
      LIMIT 24
    `).all() as Array<{ time_label: string; total: number; pass: number; fail: number }>;

    // 5. Model breakdown (BarChart)
    const modelStats = db.prepare(`
      SELECT 
        d.model_name,
        COUNT(*) as total,
        SUM(CASE WHEN tl.test_result = 'PASS' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN tl.test_result = 'FAIL' THEN 1 ELSE 0 END) as fail
      FROM test_logs tl
      JOIN devices d ON tl.device_id = d.id
      GROUP BY d.model_name
      ORDER BY total DESC
      LIMIT 8
    `).all() as Array<{ model_name: string; total: number; pass: number; fail: number }>;

    const formattedModelStats = modelStats.map(m => ({
      model: m.model_name,
      total: m.total,
      pass: m.pass,
      fail: m.fail,
      passRate: m.total > 0 ? Number(((m.pass / m.total) * 100).toFixed(1)) : 0
    }));

    // 6. Operator stats
    const operatorStats = db.prepare(`
      SELECT 
        operator_name,
        COUNT(*) as total,
        SUM(CASE WHEN test_result = 'PASS' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN test_result = 'FAIL' THEN 1 ELSE 0 END) as fail
      FROM test_logs
      GROUP BY operator_name
      ORDER BY total DESC
    `).all();

    return res.json({
      summary: {
        total_tests: totalTests,
        pass_count: passCount,
        fail_count: failCount,
        pass_rate: passRate,
        defect_rate: defectRate,
        today_total: todayMetrics.today_total || 0,
        today_pass: todayMetrics.today_pass || 0,
        today_fail: todayMetrics.today_fail || 0
      },
      failure_reasons: formattedFailureReasons,
      trend: trendRows,
      models: formattedModelStats,
      operators: operatorStats
    });
  } catch (error: any) {
    console.error('[StatsController] Error fetching stats:', error);
    return res.status(500).json({ error: error.message });
  }
}
