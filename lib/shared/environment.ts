import {env} from "node:process"


function throwIfEnvNotDefined(key: string): string {
  const value = env[key]
  if (value === undefined) {
    throw new Error(`Key ${key} is not defined in environment`)
  }
  return value;
}

export const LOCAL_ENVIRONMENT = {
  notificationEmail: throwIfEnvNotDefined('NOTIFICATION_EMAIL'),
  discordNotificationsWebhook: throwIfEnvNotDefined('DISCORD_NOTIFICATION_WEBHOOK_URL'),
  discordUserToMention: throwIfEnvNotDefined('DISCORD_USER_TO_MENTION')
}
