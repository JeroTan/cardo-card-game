import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { validateRoomCode, normalizeRoomCode } from '@/utils/roomCode';
import { ApiJoinRoomByCode } from '@/api/client/game';

interface CustomRoomInputProps {
  onJoinSuccess?: (roomId: string) => void;
}

export default function CustomRoomInput({ onJoinSuccess }: CustomRoomInputProps) {
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeRoomCode(e.target.value);
    // Limit to 6 characters
    setCode(value.slice(0, 6));
    setError('');
  };

  const handleJoin = async () => {
    // Validate code format
    if (!validateRoomCode(code)) {
      setError('Invalid room code. Must be 6 alphanumeric characters.');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const { promiseResponse } = ApiJoinRoomByCode({ code });
      const response = await promiseResponse;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as any)?.message || 'Failed to join room');
      }

      const data = await response.json() as { roomId: string };
      toast.success('Joined room successfully!');
      
      // Redirect to room lobby
      onJoinSuccess?.(data.roomId);
      window.location.href = `/custom-room/lobby/${data.roomId}`;
    } catch (error: any) {
      setError(error.message || 'Failed to join room');
      toast.error(error.message || 'Failed to join room');
      console.error('Join room error:', error);
    } finally {
      setIsJoining(false);
    }
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
            placeholder="Enter 6-character code"
            value={code}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            maxLength={6}
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
          disabled={isJoining || code.length !== 6}
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
