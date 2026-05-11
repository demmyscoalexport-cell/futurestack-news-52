import { Inngest } from "inngest";
import type {
  FetchSignalsEvent,
  SignalReceivedEvent,
  ArticleApprovedEvent,
  ArticlePublishedEvent,
} from "./types";

export const inngest = new Inngest({
  id: "futurestack-news",
  name: "FutureStack News",
  schemas: {
    "news/fetch.signals": {} as { data: FetchSignalsEvent },
    "news/signal.received": {} as { data: SignalReceivedEvent },
    "article/approved.for.generation": {} as { data: ArticleApprovedEvent },
    "article/published": {} as { data: ArticlePublishedEvent },
  } as Record<string, { data: unknown }>,
});
