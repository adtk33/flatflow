export function computeBalances(
  expenses: {
    paidById: string
    shares: { userId: string; amount: number; settled: boolean }[]
  }[]
) {
  const balances: Record<string, number> = {}

  for (const expense of expenses) {
    for (const share of expense.shares) {
      if (share.settled) continue

      if (share.userId === expense.paidById) continue

      // Payer is owed this amount
      balances[expense.paidById] = (balances[expense.paidById] || 0) + share.amount
      // Participant owes this amount
      balances[share.userId] = (balances[share.userId] || 0) - share.amount
    }
  }

  return balances
}

export function computeSettlements(balances: Record<string, number>) {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => a.amount - b.amount)

  const transfers: { from: string; to: string; amount: number }[] = []

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = Math.min(creditor.amount, -debtor.amount)

    transfers.push({
      from: debtor.id,
      to: creditor.id,
      amount: +amount.toFixed(2)
    })

    creditors[i].amount -= amount
    debtors[j].amount += amount

    if (creditors[i].amount < 0.01) i++
    if (Math.abs(debtors[j].amount) < 0.01) j++
  }

  return transfers
}