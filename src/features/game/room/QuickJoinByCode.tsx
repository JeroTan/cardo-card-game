import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { ApiJoinRoomByCode } from '@/api/client/game';

interface QuickJoinByCodeProps {
  userId: string;
  code: string;
}

export default function QuickJoinByCode({ userId, code }: QuickJoinByCodeProps) {
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    joinRoom();
  }, [code]);

  const joinRoom = async () => {
    setStatus('joining');
    setErrorMessage('');

    try {
      const { promiseResponse } = ApiJoinRoomByCode({ code });
      const response = await promiseResponse;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as any)?.message || 'Failed to join room');
      }

      const data = await response.json() as { roomId: string };
      setStatus('success');
      toast.success('Joined room successfully!');
      
      // Redirect to lobby after short delay
      setTimeout(() => {
        window.location.href = `/custom-room/lobby/${data.roomId}`;
      }, 500);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to join room');
      toast.error(error.message || 'Failed to join room');
      console.error('Join room error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'joining' && 'Joining Room...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Join Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Joining State */}
          {status === 'joining' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Joining room with code: <span className="font-mono font-bold">{code}</span>
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-center">
                Redirecting to lobby...
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button onClick={joinRoom} variant="default" className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/custom-room'} variant="outline" className="w-full">
                  Back to Custom Room
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
