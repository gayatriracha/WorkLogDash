import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [successMessage, setSuccessMessage] = useState<string>("");

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Forgot password error:", error);
    },
  });

  const onSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Alert className="border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                {successMessage}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you don't see the email in your inbox, check your spam folder.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSuccessMessage("")} 
                  className="flex-1"
                  data-testid="button-try-again"
                >
                  Try Another Email
                </Button>
                
                <Link href="/login">
                  <Button className="flex-1" data-testid="button-back-login">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-key text-2xl"></i>
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a password reset link
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {forgotPasswordMutation.isError && (
                <Alert variant="destructive" data-testid="alert-forgot-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {forgotPasswordMutation.error?.message || "Failed to send reset email. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={forgotPasswordMutation.isPending}
                data-testid="button-send-reset"
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
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