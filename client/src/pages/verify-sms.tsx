import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifySMSSchema, type VerifySMSData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Smartphone } from "lucide-react";

export default function VerifySMS() {
  const [, setLocation] = useLocation();
  const [isVerified, setIsVerified] = useState(false);

  const form = useForm<VerifySMSData>({
    resolver: zodResolver(verifySMSSchema),
    defaultValues: {
      phoneNumber: "",
      code: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifySMSData) => {
      const response = await apiRequest("POST", "/api/auth/verify-sms", data);
      return response.json();
    },
    onSuccess: () => {
      setIsVerified(true);
    },
    onError: (error: any) => {
      console.error("SMS verification error:", error);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-sms", { phoneNumber });
      return response.json();
    },
    onError: (error: any) => {
      console.error("Resend SMS error:", error);
    },
  });

  const onSubmit = (data: VerifySMSData) => {
    verifyMutation.mutate(data);
  };

  const handleResend = () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (phoneNumber) {
      resendMutation.mutate(phoneNumber);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Phone Verified!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Alert className="border-green-200 dark:border-green-800">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your phone number has been successfully verified. You can now login to your account.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => setLocation("/login")} 
              className="w-full"
              data-testid="button-goto-login"
            >
              Go to Login
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
          <div className="bg-primary text-primary-foreground p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Smartphone className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Verify Phone Number</CardTitle>
          <p className="text-muted-foreground">
            Enter your phone number and the verification code sent to you
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="+1234567890" 
                        {...field} 
                        data-testid="input-phoneNumber"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="123456" 
                        maxLength={6}
                        {...field} 
                        data-testid="input-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {verifyMutation.isError && (
                <Alert variant="destructive" data-testid="alert-verify-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verifyMutation.error?.message || "Verification failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {resendMutation.isSuccess && (
                <Alert className="border-green-200 dark:border-green-800" data-testid="alert-resend-success">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    New verification code sent successfully!
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyMutation.isPending}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify Phone Number"}
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full" 
                disabled={resendMutation.isPending}
                onClick={handleResend}
                data-testid="button-resend"
              >
                {resendMutation.isPending ? "Sending..." : "Resend Code"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <Link href="/login">
                <Button variant="link" className="p-0 h-auto" data-testid="link-login">
                  Sign in
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}