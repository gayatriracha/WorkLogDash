import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>("");

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-email", { token });
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationStatus('success');
      setMessage(data.message);
    },
    onError: (error: any) => {
      setVerificationStatus('error');
      setMessage(error.message || "Email verification failed");
      console.error("Email verification error:", error);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmailMutation.mutate(token);
  }, [search]);

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage(data.message);
    },
    onError: (error: any) => {
      setMessage(error.message || "Failed to resend verification email");
    },
  });

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Verifying Email...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Alert className="border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {message}
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => setLocation("/login")} 
              className="w-full"
              data-testid="button-goto-login"
            >
              Sign In Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Alert variant="destructive" className="border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The verification link may have expired or is invalid.
            </p>
            
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="outline" className="flex-1" data-testid="button-back-login">
                  Back to Login
                </Button>
              </Link>
              
              <Link href="/signup">
                <Button className="flex-1" data-testid="button-try-signup">
                  Try Again
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}