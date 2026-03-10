interface HealthInput {
  profit: number;
  romi: number;
  revenue: number;
  prevRevenue: number;
  traffic: number;
  prevTraffic: number;
  formatShares: number[];
}

export function calculateHealthScore(input: HealthInput): number {
  let score = 50;

  // Profit quality (0-25 points)
  if (input.profit > 0) {
    score += Math.min(25, input.profit / 10);
  } else {
    score -= Math.min(30, Math.abs(input.profit) / 5);
  }

  // ROMI quality (0-20 points)
  if (input.romi > 100) score += 20;
  else if (input.romi > 50) score += 15;
  else if (input.romi > 0) score += 10;
  else if (input.romi > -20) score += 0;
  else score -= 15;

  // Revenue stability (0-15 points)
  if (input.prevRevenue > 0) {
    const revenueChange = (input.revenue - input.prevRevenue) / input.prevRevenue;
    if (revenueChange > 0.05) score += 15;
    else if (revenueChange > -0.05) score += 10;
    else if (revenueChange > -0.15) score += 5;
    else score -= 10;
  }

  // Traffic stability (0-10 points)
  if (input.prevTraffic > 0) {
    const trafficChange = (input.traffic - input.prevTraffic) / input.prevTraffic;
    if (trafficChange > 0.05) score += 10;
    else if (trafficChange > -0.05) score += 7;
    else if (trafficChange > -0.15) score += 3;
    else score -= 5;
  }

  // Format diversification (0-10 points)
  if (input.formatShares.length > 0) {
    const maxShare = Math.max(...input.formatShares);
    if (maxShare < 40) score += 10;
    else if (maxShare < 60) score += 7;
    else if (maxShare < 80) score += 3;
    else score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getHealthStatus(score: number): "healthy" | "warning" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "critical";
}
