import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  updatedSettings(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
