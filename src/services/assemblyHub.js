import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { BASE } from './api';

// Built from the same BASE as every REST call. A second hardcoded origin here
// is how a production deploy breaks in a way that looks like a SignalR bug.
export const ASSEMBLY_HUB_URL = `${BASE}/hubs/skupstina`;

// Method names the server sends. Mirrors AssemblyHub.Events on the backend.
export const HUB_EVENTS = {
  PresenceSnapshot: 'PresenceSnapshot',
  MemberJoined: 'MemberJoined',
  MemberLeft: 'MemberLeft',
  SeatChanged: 'SeatChanged',
  SessionChanged: 'SessionChanged',
  TopicChanged: 'TopicChanged',
  TopicRemoved: 'TopicRemoved',
  AgendaReordered: 'AgendaReordered',
  VoteTally: 'VoteTally',
};

export function buildAssemblyConnection() {
  return new HubConnectionBuilder()
    .withUrl(ASSEMBLY_HUB_URL, {
      // Called on every connect and every reconnect, so a refreshed token is
      // picked up for free. Never read the token outside this closure.
      accessTokenFactory: () => localStorage.getItem('bedem_token') ?? '',

      // Negotiation stays on: it is what lets the token ride in an
      // Authorization header for the handshake, leaving only the socket URL
      // carrying it as a query parameter.
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
}
