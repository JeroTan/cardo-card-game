import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';

interface RoomCodeDisplayProps {
  code: string;
  roomId: string;
}

export default function RoomCodeDisplay({ code, roomId }: RoomCodeDisplayProps) {
  const shareUrl = `${window.location.origin}/custom-room/join/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Room code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy room code');
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join my CARDO game',
      text: `Room code: ${code}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback: copy link instead
        await navigator.clipboard.writeText(shareUrl);
        toast.info('Link copied to clipboard');
      }
    } catch (err: any) {
      // AbortError is not really an error (user cancelled share)
      if (err.name !== 'AbortError') {
        toast.error('Failed to share');
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Room Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Code Display */}
        <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
          <span className="text-5xl font-bold tracking-widest font-mono">
            {code}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Share Link Display */}
        <div className="text-xs text-muted-foreground text-center">
          <span className="block">Share link:</span>
          <span className="font-mono">{shareUrl}</span>
        </div>
      </CardContent>
    </Card>
  );
}
