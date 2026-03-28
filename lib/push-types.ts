export type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushSubscriberRecord = {
  clientId: string;
  timezone: string;
  pendingIssueDates: string[];
  subscription: WebPushSubscription;
  createdAt: string;
  updatedAt: string;
  lastDailyPushDate?: string;
};
