import { User, Bot, Trash2, LogOut, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlayerRoomInfo } from '@/types/game/room';

interface PlayerListItemProps {
  player: PlayerRoomInfo;
  currentUserId: string;
  isCurrentUserCreator: boolean;
  onRemove?: (playerId: string) => void;
  onLeave?: () => void;
}

export default function PlayerListItem({
  player,
  currentUserId,
  isCurrentUserCreator,
  onRemove,
  onLeave,
}: PlayerListItemProps) {
  const isCurrentUser = player.id === currentUserId;
  const isReady = player.status === 'READY_FOR_CUSTOM_ROOM';
  const isBot = player.username.startsWith('Bot ');
  const canRemove = isCurrentUserCreator && !player.owner && !isCurrentUser;
  const canLeave = isCurrentUser && !player.owner;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        isReady ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-card'
      )}
    >
      {/* Player Icon */}
      <div className="flex-shrink-0">
        {isBot ? (
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-purple-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">
            {player.username}
            {isCurrentUser && ' (You)'}
          </span>
          
          {player.owner && (
            <Badge variant="default" className="text-xs">
              Creator
            </Badge>
          )}
          
          {isBot && (
            <Badge variant="secondary" className="text-xs">
              Bot
            </Badge>
          )}
          
          {isReady && (
            <Badge variant="default" className="text-xs bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-2">
        {canRemove && onRemove && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(player.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {canLeave && onLeave && (
          <Button
            size="sm"
            variant="outline"
            onClick={onLeave}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Leave
          </Button>
        )}
      </div>
    </div>
  );
}
