import type { DolphinMessageType } from "@slippi/slippi-js";
import type { Observable } from "observable-fns";

export type BroadcasterItem = {
  broadcaster: {
    name: string;
    uid: string;
  };
  id: string;
  name: string;
};

export type StartBroadcastConfig = {
  ip: string;
  port: number;
  viewerId: string;
  authToken: string;
  name?: string;
};

export enum BroadcastEvent {
  SLIPPI_STATUS_CHANGE = "SLIPPI_STATUS_CHANGE",
  DOLPHIN_STATUS_CHANGE = "DOLPHIN_STATUS_CHANGE",
  ERROR = "ERROR",
  LOG = "LOG",
  RECONNECT = "RECONNECT",
}

export enum SpectateEvent {
  ERROR = "ERROR",
  BROADCAST_LIST_UPDATE = "BROADCAST_LIST_UPDATE",
  NEW_FILE = "NEW_FILE",
  LOG = "LOG",
  RECONNECT = "RECONNECT",
  GAME_END = "GAME_END",
}

type TypeMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
      } & M[Key];
};

type SlippiPlayload = {
  payload: string;
  cursor: number;
  nextCursor: number;
};

type SlippiBroadcastEventPayload = {
  [DolphinMessageType.CONNECT_REPLY]: {
    version: number;
    nick: string;
    cursor: number;
  };
  [DolphinMessageType.GAME_EVENT]: SlippiPlayload;
  [DolphinMessageType.END_GAME]: SlippiPlayload;
  [DolphinMessageType.START_GAME]: SlippiPlayload;
};

export type SlippiBroadcastPayloadEvent =
  TypeMap<SlippiBroadcastEventPayload>[keyof TypeMap<SlippiBroadcastEventPayload>];

export type BroadcastService = {
  onSpectateReconnect(handle: () => void): () => void;
  onBroadcastReconnect(handle: (config: StartBroadcastConfig) => void): () => void;
  onBroadcastErrorMessage(handle: (message: string | null) => void): () => void;
  onBroadcastListUpdated(handle: (items: BroadcasterItem[]) => void): () => void;
  onDolphinStatusChanged(handle: (status: number) => void): () => void;
  onSlippiStatusChanged(handle: (status: number) => void): () => void;
  onSpectateErrorMessage(handle: (message: string | null) => void): () => void;
  connect(authToken: string): Promise<void>;
  refreshBroadcastList(): Promise<void>;
  watchBroadcast(broadcasterId: string): Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
};

export type SpectateDolphinOptions = {
  dolphinId?: string;
  idPostfix?: string;
};

export interface SpectateController {
  startSpectate(broadcastId: string, targetPath: string, dolphinOptions: SpectateDolphinOptions): Promise<string>;
  dolphinClosed(playbackId: string): Promise<void>;
  connect(authToken: string): Promise<void>;
  refreshBroadcastList(): Promise<void>;
  getOpenBroadcasts(): Promise<{ broadcastId: string; dolphinId: string }[]>;
  getBroadcastListObservable(): Observable<BroadcasterItem[]>;
  getSpectateDetailsObservable(): Observable<{ playbackId: string; filePath: string; broadcasterName: string }>;
  getGameEndObservable(): Observable<string>;
}
