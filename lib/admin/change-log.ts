import { getBrowserSupabaseClient } from '@/lib/supabase/client'

type ChangeLogPayload = {
  entityType: string
  entityId: string
  actionType: string
  changedFields?: Record<string, unknown> | null
  note?: string | null
}

export async function logAdminChange(payload: ChangeLogPayload) {
  try {
    const supabase = getBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('change_logs').insert({
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      action_type: payload.actionType,
      changed_fields: payload.changedFields ?? null,
      actor_id: user?.id ?? null,
      note: payload.note ?? null,
    })
  } catch {
    // no-op: logging should not break primary admin action
  }
}
