import { useState } from 'react';
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import type { BotDifficulty } from '@/types/game/room';
import { ApiAddBotPlayer } from '@/api/client/game';

interface AddBotButtonProps {
  roomId: string;
  disabled?: boolean;
  onBotAdded?: () => void;
}

export default function AddBotButton({ roomId, disabled = false, onBotAdded }: AddBotButtonProps) {
  const [difficulty, setDifficulty] = useState<BotDifficulty>('MEDIUM');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBot = async () => {
    setIsAdding(true);
    try {
      const { promiseResponse } = ApiAddBotPlayer({ roomId, difficulty });
      const response = await promiseResponse;

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.message || 'Failed to add bot');
      }

      const data = await response.json() as { username: string };
      toast.success(`${data.username} added to the room`);
      onBotAdded?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bot');
      console.error('Add bot error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <Label className="text-base">Add Bot Player</Label>
      </div>

      <div className="flex gap-2">
        <Select
          value={difficulty}
          onValueChange={(value) => setDifficulty(value as BotDifficulty)}
          disabled={disabled || isAdding}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleAddBot}
          disabled={disabled || isAdding}
          size="default"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
