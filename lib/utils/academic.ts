/**
 * Extracts the student numeric identifier from official university emails.
 * Example: '42510428.abdullah@acu.edu.eg' -> '42510428'
 */
export function extractStudentId(email: string): string | null {
  if (!email || !email.toLowerCase().includes('@acu.edu.eg')) return null
  const localPart = email.split('@')[0]
  if (!localPart) return null
  const parts = localPart.split('.')
  return parts[0] ? parts[0].trim() : null
}

/**
 * Returns human-readable label for academic years.
 * Example: 1 -> 'First Year', 2 -> 'Second Year'
 */
export function academicYearLabel(year: number | null | undefined): string {
  if (!year) return 'Unclassified'
  switch (year) {
    case 1:
      return 'First Year'
    case 2:
      return 'Second Year'
    case 3:
      return 'Third Year'
    case 4:
      return 'Fourth Year'
    default:
      return `Year ${year}`
  }
}
