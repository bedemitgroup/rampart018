import { useEffect, useRef, useState } from 'react';
import { buildAssemblyConnection, HUB_EVENTS } from '../services/assemblyHub';

/**
 * One live connection to one session's hall, for as long as the component is
 * mounted. Returns the connection state so the page can say so out loud — a
 * socket that died quietly during a sitting is how someone's seat silently
 * stops updating.
 *
 * @param {number|null} sessionId  null while the session is still loading
 * @param {object} handlers        { onPresence, onMemberJoined, onMemberLeft,
 *                                   onSeatChanged, onSessionChanged, onTopicChanged,
 *                                   onTopicRemoved, onAgendaReordered, onVoteTally,
 *                                   onResync }
 * @returns {'idle'|'connecting'|'live'|'reconnecting'|'offline'}
 */
export function useAssemblyLive(sessionId, handlers) {
  const [liveState, setLiveState] = useState('idle');

  // Handlers are rebuilt on every render of the parent. Putting them in the
  // dependency array would tear the socket down and build it again on every
  // keystroke elsewhere on the page.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;

    // Created inside the effect, never in module scope or a ref: StrictMode
    // mounts twice in development, and a shared connection would mean the
    // first unmount stops the socket the second mount is using.
    const connection = buildAssemblyConnection();

    // Registered before start(), so nothing arriving during the handshake is
    // dropped on the floor.
    connection.on(HUB_EVENTS.PresenceSnapshot, (p) => handlersRef.current.onPresence?.(p));
    connection.on(HUB_EVENTS.MemberJoined, (p) => handlersRef.current.onMemberJoined?.(p));
    connection.on(HUB_EVENTS.MemberLeft, (id) => handlersRef.current.onMemberLeft?.(id));
    connection.on(HUB_EVENTS.SeatChanged, (p) => handlersRef.current.onSeatChanged?.(p));
    connection.on(HUB_EVENTS.SessionChanged, (p) => handlersRef.current.onSessionChanged?.(p));
    connection.on(HUB_EVENTS.TopicChanged, (p) => handlersRef.current.onTopicChanged?.(p));
    connection.on(HUB_EVENTS.TopicRemoved, (id) => handlersRef.current.onTopicRemoved?.(id));
    connection.on(HUB_EVENTS.AgendaReordered, (p) => handlersRef.current.onAgendaReordered?.(p));
    connection.on(HUB_EVENTS.VoteTally, (p) => handlersRef.current.onVoteTally?.(p));

    connection.onreconnecting(() => {
      if (!cancelled) setLiveState('reconnecting');
    });

    // Group membership lives in the server process and nowhere else, so a
    // reconnect — and every backend restart — hands out a fresh connection
    // that belongs to no group. Re-joining here is not an optimisation:
    // without it the page looks connected and silently receives nothing,
    // which is the worst failure mode because it does not look like one.
    connection.onreconnected(async () => {
      if (cancelled) return;
      try {
        await connection.invoke('JoinSession', sessionId);
        if (cancelled) return;
        setLiveState('live');
        handlersRef.current.onResync?.();
      } catch {
        if (!cancelled) setLiveState('offline');
      }
    });

    // Fires once the retry schedule is exhausted, and straight away when the
    // token has expired.
    connection.onclose(() => {
      if (!cancelled) setLiveState('offline');
    });

    setLiveState('connecting');

    const started = (async () => {
      try {
        await connection.start();
        if (cancelled) return;
        await connection.invoke('JoinSession', sessionId);
        if (!cancelled) setLiveState('live');
      } catch {
        if (!cancelled) setLiveState('offline');
      }
    })();

    return () => {
      cancelled = true;
      // Queued behind start(), not raced against it. Calling stop() while the
      // handshake is still in flight orphans the socket, and the next mount
      // throws "Cannot start a HubConnection that is not in the
      // 'Disconnected' state".
      started.finally(() => connection.stop());
    };
  }, [sessionId]);

  return liveState;
}
