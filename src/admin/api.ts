import { fbApi } from "../lib/firebaseApi";

export const api = {
  stats: () => fbApi.stats(),

  users: {
    list: (params?: Record<string, string>) => fbApi.users.list(params),
    get: (id: string) => fbApi.users.get(id),
    create: (data: unknown) => fbApi.users.create(data),
    update: (id: string, data: unknown) => fbApi.users.update(id, data),
    delete: (id: string) => fbApi.users.delete(id),
  },

  content: {
    list: (params?: Record<string, string>) => fbApi.content.list(params),
    get: (id: string) => fbApi.content.get(id),
    create: (data: unknown) => fbApi.content.create(data),
    update: (id: string, data: unknown) => fbApi.content.update(id, data),
    delete: (id: string) => fbApi.content.delete(id),
    episodes: {
      list: (id: string) => fbApi.content.episodes.list(id),
      create: (id: string, data: unknown) => fbApi.content.episodes.create(id, data),
      update: (id: string, epId: string, data: unknown) => fbApi.content.episodes.update(id, epId, data),
      delete: (id: string, epId: string) => fbApi.content.episodes.delete(id, epId),
    },
  },

  carousel: {
    list: () => fbApi.carousel.list().then((items) => ({ carousel: items })),
    create: (data: unknown) => fbApi.carousel.create(data),
    update: (id: string, data: unknown) => fbApi.carousel.update(id, data),
    delete: (id: string) => fbApi.carousel.delete(id),
  },

  featured: {
    list: () => fbApi.featured.list().then((items) => ({ featured: items })),
    create: (data: unknown) => fbApi.featured.create(data),
    update: (id: string, data: unknown) => fbApi.featured.update(id, data),
    delete: (id: string) => fbApi.featured.delete(id),
    contentList: () => fbApi.featured.contentList().then((items) => ({ content: items })),
  },

  subscriptions: {
    list: (params?: Record<string, string>) => fbApi.subscriptions.list(params),
    create: (data: unknown) => fbApi.subscriptions.create(data),
    update: (id: string, data: unknown) => fbApi.subscriptions.update(id, data),
    delete: (id: string) => fbApi.subscriptions.delete(id),
  },

  wallet: {
    get: () => fbApi.wallet.get(),
    withdraw: (data: unknown) => fbApi.wallet.withdraw(data),
    topup: (data: unknown) => fbApi.wallet.topup(data),
  },

  transactions: {
    list: (params?: Record<string, string>) => fbApi.transactions.list(params),
    delete: (id: string) => fbApi.transactions.delete(id),
  },

  activities: {
    list: (params?: Record<string, string>) => fbApi.activities.list(params),
    log: (data: unknown) => fbApi.activities.log(data),
    delete: (id: string) => fbApi.activities.delete(id),
  },

  settings: {
    get: () => fbApi.settings.get(),
    save: (data: unknown) => fbApi.settings.save(data),
  },
};
