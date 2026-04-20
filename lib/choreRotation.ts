export function generateAssignments(
  memberIds: string[],
  choreId: string,
  frequency: 'weekly' | 'biweekly',
  weeksAhead: number = 4,
  existingAssignments: { userId: string }[] = []
) {
  if (memberIds.length === 0) return []

  const assignments = []
  const effortTotals: Record<string, number> = {}

  // Initialize effort counts from existing assignments
  memberIds.forEach(id => {
    effortTotals[id] = existingAssignments.filter(a => a.userId === id).length
  })

  const intervalDays = frequency === 'weekly' ? 7 : 14
  const occurrences = Math.ceil((weeksAhead * 7) / intervalDays)
  const today = new Date()

  for (let i = 0; i < occurrences; i++) {
    // Pick member with lowest effort total
    const assignee = memberIds.reduce((minId, id) =>
      effortTotals[id] < effortTotals[minId] ? id : minId
    )

    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + i * intervalDays)

    assignments.push({
      choreId,
      userId: assignee,
      dueDate,
      status: 'pending'
    })

    effortTotals[assignee] += 1
  }

  return assignments
}