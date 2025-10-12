export function fmtPct(n: number) {
  const formatted = n.toFixed(1)
  // Add + sign for positive percentages
  return n > 0 ? `+${formatted}%` : `${formatted}%`
}

export function fmtUSD(m: number) {
  const absValue = Math.abs(m)
  const formatted = absValue.toFixed(1)
  // Add sign and color indication
  return m >= 0 ? `$${formatted}M` : `-$${formatted}M`
}
