import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Award, FileText } from 'lucide-react'

interface GradeRecord {
  id: string
  courseTitle: string
  assignmentTitle: string
  grade: number | null
  maxScore: number
  submittedAt: string | null
  feedback: string | null
}

interface GradeTableProps {
  grades: GradeRecord[]
}

export function GradeTable({ grades }: GradeTableProps) {
  if (grades.length === 0) {
    return (
      <div className="lms-card p-12 text-center">
        <Award className="w-12 h-12 text-[var(--blue-icon)] opacity-50 mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">No grades recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="lms-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[var(--bg-primary)]/60 backdrop-blur-md text-[var(--blue-glow)] uppercase font-semibold border-b border-slate-700/60">
            <tr>
              <th className="p-4">Course</th>
              <th className="p-4">Assignment</th>
              <th className="p-4">Submitted Date</th>
              <th className="p-4 text-center">Score</th>
              <th className="p-4">Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {grades.map((g) => {
              const percentage =
                g.grade !== null ? Math.round((g.grade / g.maxScore) * 100) : null
              const isPassing = percentage !== null && percentage >= 60

              return (
                <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white">{g.courseTitle}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[var(--blue-icon)]" />
                      <span>{g.assignmentTitle}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">
                    {g.submittedAt ? new Date(g.submittedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    {g.grade !== null ? (
                      <span
                        className={`font-extrabold text-sm px-2.5 py-1 rounded-md border ${
                          isPassing
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {g.grade} / {g.maxScore} ({percentage}%)
                      </span>
                    ) : (
                      <Badge variant="amber">Pending</Badge>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 italic max-w-xs truncate">
                    {g.feedback || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
