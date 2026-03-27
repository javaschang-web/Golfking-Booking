import type { CSSProperties } from 'react'
import { colors } from '@/lib/design'

export function getStatusBadgeStyle(status: string): { label: string; style: CSSProperties } {
  switch (status) {
    case 'ok':
    case 'verified':
    case 'active':
      return {
        label: status === 'ok' ? '계산 완료' : status,
        style: { background: '#123622', color: '#92f2a4', border: `1px solid ${colors.border}` },
      }
    case 'needs_review':
    case 'reviewing':
      return {
        label: status === 'needs_review' ? '검토 필요' : status,
        style: { background: '#3f3614', color: '#ffd86b', border: '1px solid #6b5a1e' },
      }
    case 'unknown':
    case 'draft':
      return {
        label: status === 'unknown' ? '정보 부족' : status,
        style: { background: '#20313b', color: '#b8d7ff', border: '1px solid #37576a' },
      }
    case 'inactive':
    case 'hidden':
    case 'dismissed':
      return {
        label: status,
        style: { background: '#31252a', color: '#ff9cab', border: '1px solid #5f3340' },
      }
    default:
      return {
        label: status,
        style: { background: colors.primaryMuted, color: colors.text, border: `1px solid ${colors.border}` },
      }
  }
}
