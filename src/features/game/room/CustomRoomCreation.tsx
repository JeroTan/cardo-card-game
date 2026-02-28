import { useState, useEffect, useRef } from 'react';
import { Play, Check, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import RoomCodeDisplay from './components/RoomCodeDisplay';
import PlayerListItem from './components/PlayerListItem';
import AddBotButton from './components/AddBotButton';
import type { RoomInfo, LobbyWSMessage, PlayerRoomInfo } from '@/types/game/room';
import { ApiCreateCustomRoom, ApiUpdateCustomRoom, ApiToggleReadyState, ApiRemovePlayerFromRoom, ApiGetCustomRoomState } from '@/api/client/game';

interface CustomRoomCreationProps {
  userId: string;
  roomId?: string; // If provided, join existing room; otherwise create new
}

export default function CustomRoomCreation({ userId, roomId: initialRoomId }: CustomRoomCreationProps) {
  const [state, setState] = useState<'creating' | 'lobby'>('creating');
  const [lobbyInfo, setLobbyInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const currentPlayer = lobbyInfo?.players.find(p => p.id === userId);
  const isCreator = currentPlayer?.owner ?? false;
  const allPlayersReady = lobbyInfo?.players.every(p => p.status === 'READY_FOR_CUSTOM_ROOM' || p.owner) ?? false;
  const canStart = isCreator && allPlayersReady && (lobbyInfo?.players.length ?? 0) >= 2;

  // Create or join room on mount
  useEffect(() => {
    if (initialRoomId) {
      // Join existing room
      joinRoom(initialRoomId);
    } else {
      // Create new room
      createRoom();
    }
  }, [initialRoomId]);

  // WebSocket connection
  useEffect(() => {
    if (!lobbyInfo) return;

    connectWebSocket(lobbyInfo.id);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [lobbyInfo?.id]);

  const fetchRoomState = async (roomId: string) => {
    try {
      const { promiseResponse } = ApiGetCustomRoomState(roomId);
      const response = await promiseResponse;

      if (!response.ok) {
        throw new Error('Failed to fetch room state');
      }

      const result = await response.json() as { data: RoomInfo };
      setLobbyInfo(result.data);
    } catch (error) {
      console.error('Fetch room state error:', error);
      toast.error('Failed to fetch room state');
    }
  };

  const createRoom = async () => {
    setIsLoading(true);
    try {
      const { promiseResponse } = ApiCreateCustomRoom({
        roomName: `Custom Room ${Date.now().toString().slice(-6)}`,
        type: 'OPEN',
      });
      const response = await promiseResponse;

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.message || 'Failed to create room');
      }

      const data = await response.json() as { roomId: string; message: string };
      // Fetch the full room state after creation
      await fetchRoomState(data.roomId);
      setState('lobby');
      toast.success('Room created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
      console.error('Create room error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    setIsLoading(true);
    try {
      // Fetch the room state
      await fetchRoomState(roomId);
      setState('lobby');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
      console.error('Join room error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (roomId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/websocket?roomId=${roomId}&playerId=${userId}`);

    ws.onopen = () => {
      console.log('WebSocket connected to lobby');
    };

    ws.onmessage = (event) => {
      try {
        const message: LobbyWSMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message: LobbyWSMessage) => {
    switch (message.type) {
      case 'PLAYER_JOINED':
        setLobbyInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: [...prev.players, message.player],
          };
        });
        toast.info(`${message.player.username} joined the room`);
        break;

      case 'PLAYER_LEAVE':
        setLobbyInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.filter(p => p.id !== message.playerId),
          };
        });
        if (message.playerId === userId) {
          toast.error('You left the room');
          window.location.href = '/';
        }
        break;

      case 'PLAYER_READY':
        setLobbyInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p =>
              p.id === message.playerId ? { ...p, status: 'READY_FOR_CUSTOM_ROOM' } : p
            ),
          };
        });
        break;

      case 'PLAYER_NOT_READY':
        setLobbyInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p =>
              p.id === message.playerId ? { ...p, status: 'JOINED' } : p
            ),
          };
        });
        break;

      case 'BOT_ADDED':
        setLobbyInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: [...prev.players, message.bot],
          };
        });
        break;

      case 'GAME_STARTING':
        toast.success('Game is starting!');
        window.location.href = `/room/${message.roomId}`;
        break;

      case 'LOBBY_UPDATE':
        setLobbyInfo(message.lobby);
        break;
    }
  };

  const handleToggleReady = async () => {
    if (!lobbyInfo) return;

    const isReady = currentPlayer?.status === 'READY_FOR_CUSTOM_ROOM';

    try {
      const { promiseResponse } = ApiToggleReadyState({ roomId: lobbyInfo.id, ready: !isReady });
      const response = await promiseResponse;

      if (!response.ok) {
        throw new Error('Failed to toggle ready state');
      }
    } catch (error) {
      toast.error('Failed to update ready state');
      console.error('Toggle ready error:', error);
    }
  };

  const handleUpdateRoom = async (roomName?: string, type?: 'OPEN' | 'INVITE_ONLY') => {
    if (!lobbyInfo || !isCreator) return;

    try {
      const { promiseResponse } = ApiUpdateCustomRoom({ 
        roomId: lobbyInfo.id, 
        roomName, 
        type 
      });
      const response = await promiseResponse;

      if (!response.ok) {
        throw new Error('Failed to update room');
      }

      // Fetch updated room state
      await fetchRoomState(lobbyInfo.id);
      toast.success('Room updated successfully');
    } catch (error) {
      toast.error('Failed to update room');
      console.error('Update room error:', error);
    }
  };

  const handleStartGame = async () => {
    if (!lobbyInfo || !canStart) return;

    setIsStarting(true);
    toast.info('Starting game...');
    // Game start is handled by the Durable Object, WebSocket will notify us
    setIsStarting(false);
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!lobbyInfo) return;

    try {
      const { promiseResponse } = ApiRemovePlayerFromRoom({ roomId: lobbyInfo.id, targetPlayerId: playerId });
      const response = await promiseResponse;

      if (!response.ok) {
        throw new Error('Failed to remove player');
      }
    } catch (error) {
      toast.error('Failed to remove player');
      console.error('Remove player error:', error);
    }
  };

  const handleLeave = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    window.location.href = '/';
  };

  // Loading state
  if (isLoading || !lobbyInfo) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Lobby UI
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Users className="h-6 w-6" />
          Game Lobby
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Room Code Display */}
        <RoomCodeDisplay code={lobbyInfo.id} roomId={lobbyInfo.id} />

        <Separator />

        {/* Player List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Players ({lobbyInfo.players.length}/4)
          </h3>

          {lobbyInfo.players.map((player) => (
            <PlayerListItem
              key={player.id}
              player={{
                id: player.id,
                username: player.username,
                isReady: player.status === 'READY_FOR_CUSTOM_ROOM',
                isCreator: player.owner,
                isBot: false,
              }}
              currentUserId={userId}
              isCurrentUserCreator={isCreator}
              onRemove={handleRemovePlayer}
              onLeave={handleLeave}
            />
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 4 - lobbyInfo.players.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20"
            >
              <Empty>
                <EmptyHeader>
                  <EmptyTitle className="text-sm text-muted-foreground">
                    Waiting for player...
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          ))}
        </div>

        {/* Add Bot Section (Creator Only) */}
        {isCreator && lobbyInfo.players.length < 4 && (
          <>
            <Separator />
            <AddBotButton
              roomId={lobbyInfo.id}
              disabled={lobbyInfo.players.length >= 4}
            />
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        {/* Ready Button (All Players) */}
        {!isCreator && (
          <Button
            onClick={handleToggleReady}
            variant={currentPlayer?.status === 'READY_FOR_CUSTOM_ROOM' ? 'default' : 'outline'}
            size="lg"
            className="flex-1"
          >
            <Check className="mr-2 h-5 w-5" />
            {currentPlayer?.status === 'READY_FOR_CUSTOM_ROOM' ? 'Ready' : 'Not Ready'}
          </Button>
        )}

        {/* Start Game Button (Creator Only) */}
        {isCreator && (
          <Button
            onClick={handleStartGame}
            disabled={!canStart || isStarting}
            size="lg"
            className="flex-1"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
