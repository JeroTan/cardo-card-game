import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Check, Users, Loader2, Edit2, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import RoomCodeDisplay from './components/RoomCodeDisplay';
import PlayerListItem from './components/PlayerListItem';
import AddBotButton from './components/AddBotButton';
import type { RoomInfo, LobbyWSMessage, PlayerRoomInfo } from '@/types/game/room';
import { ApiUpdateCustomRoom, ApiToggleReadyState, ApiRemovePlayerFromRoom, ApiGetCustomRoomState, WSJoinRoomLobbyByCode } from '@/api/client/game';
import { useEffectOnce } from 'react-use';
import RoomLoading from './components/RoomLoading';
import type { WebSocketNative } from '@jsarmyknife/native--http';

interface CustomRoomCreationProps {
  userId: string,
  roomId: string,
}

export default function CustomRoomCreation({
  userId,
  roomId,
}: CustomRoomCreationProps) {
  const [lobbyInfo, setLobbyInfo] = useState<RoomInfo | null>(null);

  useEffectOnce(()=>{
    ApiGetCustomRoomState(roomId)
    .s200((result: { data: {roomInfo: RoomInfo} }) => {
      setLobbyInfo(result.data.roomInfo);
    })
    .sOthers((error) => {
      console.error('Fetch room state error:', error);
      toast.error('Failed to fetch room state');
    });
  });
  
  return <>
    {!lobbyInfo ? <>
      <RoomLoading />
    </> : <>
      <Composer
        userId={userId}
        lobbyInfo={lobbyInfo}
        roomId={roomId}
      />
    </>} 
  </>
}


export function Composer({ 
  lobbyInfo: InitialLobbyInfo,
  userId,
  roomId
}: {
  lobbyInfo: RoomInfo,
}& CustomRoomCreationProps) {
  const [isStarting, setIsStarting] = useState(false);
  const wsRef = useRef<WebSocketNative>(null);

  const [lobbyInfo, setLobbyInfo] = useState<RoomInfo>(InitialLobbyInfo);
  const [editingName, setEditingName] = useState(false);
  const [roomName, setRoomName] = useState(InitialLobbyInfo.name);
  const [roomType, setRoomType] = useState<'OPEN' | 'INVITE_ONLY'>(
    InitialLobbyInfo.joinCondition === 'MATCHMAKING' ? 'OPEN' : InitialLobbyInfo.joinCondition
  );

  const currentPlayer = useMemo(() => lobbyInfo?.players.find(p => p.id === userId), [lobbyInfo?.players, userId]);
  const isCreator = useMemo(() => currentPlayer?.owner ?? false, [currentPlayer?.owner]);
  const allPlayersReady = useMemo(() => lobbyInfo?.players.every(p => p.status === 'READY_FOR_CUSTOM_ROOM' || p.owner) ?? false, [lobbyInfo?.players]);
  const canStart = useMemo(() => isCreator && allPlayersReady && (lobbyInfo?.players.length ?? 0) >= 2, [isCreator, allPlayersReady, lobbyInfo?.players.length]);

  const handleWebSocketMessage = useCallback((message: LobbyWSMessage) => {
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
  }, [userId]);

  const connectWebSocket = useCallback((roomId: string) => {
    const ws = WSJoinRoomLobbyByCode(roomId);
    ws.open();

    ws.receiver((event) => {
      try {
        const message: LobbyWSMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    ws.getSocket()?.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    });

    ws.getSocket()?.addEventListener('close', () => {
      console.log('WebSocket disconnected');
    });

    wsRef.current = ws;
  }, [handleWebSocketMessage]);

  const handleToggleReady = useCallback(() => {
    if (!lobbyInfo) return;

    const isReady = currentPlayer?.status === 'READY_FOR_CUSTOM_ROOM';

    ApiToggleReadyState({ roomId: lobbyInfo.id, ready: !isReady })
      .s200(() => {
        // Ready state will be updated via WebSocket
      })
      .sOthers((error) => {
        toast.error('Failed to update ready state');
        console.error('Toggle ready error:', error);
      });
  }, [lobbyInfo, currentPlayer?.status]);

  const handleUpdateRoom = useCallback((roomName?: string, type?: 'OPEN' | 'INVITE_ONLY') => {
    if (!lobbyInfo || !isCreator) return;

    ApiUpdateCustomRoom({ 
      roomId: lobbyInfo.id, 
      roomName, 
      type 
    })
      .s200(() => {
        // Room state will be updated via WebSocket
        toast.success('Room updated successfully');
        setEditingName(false);
      })
      .sOthers((error) => {
        toast.error('Failed to update room');
        console.error('Update room error:', error);
      });
  }, [lobbyInfo, isCreator]);

  const handleSaveRoomName = useCallback(() => {
    if (roomName.trim() && roomName !== lobbyInfo?.name) {
      handleUpdateRoom(roomName.trim(), undefined);
    } else {
      setEditingName(false);
    }
  }, [roomName, lobbyInfo?.name, handleUpdateRoom]);

  const handleRoomTypeChange = useCallback((type: 'OPEN' | 'INVITE_ONLY') => {
    setRoomType(type);
    handleUpdateRoom(undefined, type);
  }, [handleUpdateRoom]);

  const handleStartGame = useCallback(async () => {
    if (!lobbyInfo || !canStart) return;

    setIsStarting(true);
    toast.info('Starting game...');
    // Game start is handled by the Durable Object, WebSocket will notify us
    setIsStarting(false);
  }, [lobbyInfo, canStart]);

  const handleRemovePlayer = useCallback((playerId: string) => {
    if (!lobbyInfo) return;

    ApiRemovePlayerFromRoom({ roomId: lobbyInfo.id, targetPlayerId: playerId })
      .s200(() => {
        // Player will be removed via WebSocket update
      })
      .sOthers((error) => {
        toast.error('Failed to remove player');
        console.error('Remove player error:', error);
      });
  }, [lobbyInfo]);

  const handleLeave = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close?.();
    }
    window.location.href = '/';
  }, []);

  // WebSocket connection
  useEffectOnce(() => {
    if (!lobbyInfo) return;

    connectWebSocket(lobbyInfo.id);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  });

  // Sync room name and type when lobby info changes
  useEffect(() => {
    if (lobbyInfo) {
      setRoomName(lobbyInfo.name);
      if (lobbyInfo.joinCondition !== 'MATCHMAKING') {
        setRoomType(lobbyInfo.joinCondition);
      }
    }
  }, [lobbyInfo.name, lobbyInfo.joinCondition]);

  // Lobby UI
  // return <>Hello World</>
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Users className="h-6 w-6" />
          {editingName && isCreator ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRoomName();
                  if (e.key === 'Escape') {
                    setEditingName(false);
                    setRoomName(lobbyInfo.name);
                  }
                }}
                className="text-xl"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveRoomName}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingName(false);
                  setRoomName(lobbyInfo.name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              {lobbyInfo.name}
              {isCreator && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingName(true)}
                  className="ml-2"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Room Settings (Creator Only) */}
        {isCreator && (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
            <Label>Room Type</Label>
            <Select value={roomType} onValueChange={handleRoomTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">
                  <div className="flex items-center gap-2">
                    <LockOpen className="h-4 w-4" />
                    Open - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="INVITE_ONLY">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Invite Only - Requires code
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
              player={player}
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
