import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { normalizeRoomCode } from '@/utils/roomCode';
import { ApiJoinCustomRoom } from '@/api/client/game';

interface CustomRoomInputProps {
  onJoinSuccess?: (roomId: string) => void;
}

export default function CustomRoomInput({ onJoinSuccess }: CustomRoomInputProps) {
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeRoomCode(e.target.value);
    setCode(value);
    setError('');
  };

  const handleJoin = async () => {
    // Validate code format
    if (!code.trim()) {
      setError('Please enter a room code.');
      return;
    }

    if (code.length < 6) {
      setError('Room code is too short.');
      return;
    }

    setIsJoining(true);
    setError('');

    ApiJoinCustomRoom({ roomId: code })
      .s200((data: { roomId: string }) => {
        toast.success('Joined room successfully!');
        // Redirect to room lobby
        onJoinSuccess?.(data.roomId);
        window.location.href = `/custom-room/lobby/${data.roomId}`;
      })
      .sOthers((error) => {
        const errorMsg = error ? JSON.stringify(error) : 'Failed to join room';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('Join room error:', error);
      })
      .sAfter(() => {
        setIsJoining(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) {
      handleJoin();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Join Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-code">Room Code</Label>
          <Input
            id="room-code"
            type="text"
            placeholder="Enter room code"
            value={code}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            pattern="[A-Z0-9]*"
            className="text-2xl font-mono tracking-widest text-center uppercase"
            disabled={isJoining}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button
          onClick={handleJoin}
          disabled={isJoining || code.length < 6}
          className="w-full"
          size="lg"
        >
          <LogIn className="mr-2 h-5 w-5" />
          {isJoining ? 'Joining...' : 'Join Room'}
        </Button>
      </CardContent>
    </Card>
  );
}
