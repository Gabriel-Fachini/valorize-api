import type { TremendousWebhookEvent } from './redemption.constants'

export interface TremendousWebhookPayload {
  event: TremendousWebhookEvent
  uuid: string
  created_utc: string
  payload: {
    resource: {
      id: string
      type: string
    }
  }
}
