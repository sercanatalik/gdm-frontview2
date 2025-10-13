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

export function fmtCurrency(value: number) {
  // Format as millions with sign
  const millions = value / 1000000
  const absValue = Math.abs(millions)

  if (absValue >= 1000) {
    // Format as billions for very large numbers
    const billions = millions / 1000
    return billions >= 0 ? `$${billions.toFixed(2)}B` : `-$${Math.abs(billions).toFixed(2)}B`
  }

  return millions >= 0 ? `$${absValue.toFixed(1)}M` : `-$${absValue.toFixed(1)}M`
}
