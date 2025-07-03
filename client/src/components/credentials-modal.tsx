import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    username: string;
    password: string;
    recoveryPhrase: string;
  } | null;
}

export default function CredentialsModal({ isOpen, onClose, credentials }: CredentialsModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!credentials) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-green-600">
            Anonymous Account Created Successfully!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Important: Save These Credentials</span>
            </div>
            <p className="text-sm text-yellow-700">
              These credentials will only be shown once. Please copy and share them with the user immediately.
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm">
                {credentials.username}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(credentials.username, "Username")}
                className="shrink-0"
              >
                {copiedField === "Username" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm">
                {showPassword ? credentials.password : "••••••••••••"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(credentials.password, "Password")}
                className="shrink-0"
              >
                {copiedField === "Password" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Recovery Phrase */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recovery Phrase</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm">
                {showRecovery ? credentials.recoveryPhrase : "••••••••••••••••••••"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecovery(!showRecovery)}
                className="shrink-0"
              >
                {showRecovery ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(credentials.recoveryPhrase, "Recovery Phrase")}
                className="shrink-0"
              >
                {copiedField === "Recovery Phrase" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copy All Button */}
          <div className="pt-2">
            <Button
              onClick={() => {
                const allCredentials = `Username: ${credentials.username}\nPassword: ${credentials.password}\nRecovery Phrase: ${credentials.recoveryPhrase}`;
                copyToClipboard(allCredentials, "All credentials");
              }}
              className="w-full"
              variant="default"
            >
              {copiedField === "All credentials" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-white" />
                  Copied All Credentials!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Credentials
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}