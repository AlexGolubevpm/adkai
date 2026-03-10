export function calculateProfit(revenue: number, costs: number): number {
  return revenue - costs;
}

export function calculateRomi(revenue: number, costs: number): number {
  if (costs === 0) return 0;
  return ((revenue - costs) / costs) * 100;
}

export function calculateRevenuePer1000(revenue: number, traffic: number): number {
  if (traffic === 0) return 0;
  return (revenue / traffic) * 1000;
}

export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export interface AggregatedMetrics {
  traffic: number;
  revenue: number;
  costs: number;
  profit: number;
  romi: number;
  revenuePer1000: number;
}

export function aggregateMetrics(
  items: { traffic: number; revenue: number; costs: number }[]
): AggregatedMetrics {
  const traffic = items.reduce((sum, i) => sum + i.traffic, 0);
  const revenue = items.reduce((sum, i) => sum + i.revenue, 0);
  const costs = items.reduce((sum, i) => sum + i.costs, 0);
  const profit = calculateProfit(revenue, costs);
  const romi = calculateRomi(revenue, costs);
  const revenuePer1000 = calculateRevenuePer1000(revenue, traffic);

  return { traffic, revenue, costs, profit, romi, revenuePer1000 };
}
