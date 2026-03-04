import { useCallback, useState } from 'react';
import { Users, Plus, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CustomRoomInput from './CustomRoomInput';
import { toast } from 'react-toastify';
import { ApiCreateCustomRoom } from '@/api/client/game';

interface CustomRoomDashboardProps {
  userId?: string;
  username?: string;
}

export default function CustomRoomDashboard({ userId, username }: CustomRoomDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateRoom  = useCallback(async () => {
    setIsCreating(true);
    ApiCreateCustomRoom({
      roomName: `Custom Room ${Date.now().toString().slice(-6)}`,
      type: 'OPEN',
    }).s200((data: { roomId: string })=>{
      toast.success('Room created!');
      window.location.href = `/custom-room/lobby/${data.roomId}`;
    }).sOthers((error)=>{
      toast.error(error ? JSON.stringify(error) : 'Failed to create room');
    }).sAfter(()=>{
      setIsCreating(false);
    });
  }, []);


  const handleJoinSuccess = useCallback((roomId: string) => {
    // Redirect to lobby
    window.location.href = `/custom-room/lobby/${roomId}`;
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Users className="h-10 w-10" />
            Custom Room
          </h1>
          <p className="text-muted-foreground text-lg">
            Create a private room or join with a code
          </p>
        </div>

        {/* Show Join Input or Main Dashboard */}
        {showJoinInput ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowJoinInput(false)}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex justify-center">
              <CustomRoomInput onJoinSuccess={handleJoinSuccess} />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Room
              </CardTitle>
              <CardDescription>
                Start a new game room and invite friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                size="lg"
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create New Room'}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Join Room
              </CardTitle>
              <CardDescription>
                Enter a room code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowJoinInput(true)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Enter Code
              </Button>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
