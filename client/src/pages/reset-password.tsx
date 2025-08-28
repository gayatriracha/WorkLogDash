import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPasswordSchema, type ResetPasswordData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Lock } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const resetToken = params.get("token");
    if (!resetToken) {
      setLocation("/login");
      return;
    }
    setToken(resetToken);
  }, [search, setLocation]);

  const form = useForm<Omit<ResetPasswordData, 'token'>>({
    resolver: zodResolver(resetPasswordSchema.omit({ token: true })),
    defaultValues: {
      password: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: Omit<ResetPasswordData, 'token'>) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { ...data, token });
      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Reset password error:", error);
    },
  });

  const onSubmit = (data: Omit<ResetPasswordData, 'token'>) => {
    resetPasswordMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password">
              <Button data-testid="button-new-reset">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Password Reset!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Alert className="border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {successMessage}
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
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {resetPasswordMutation.isError && (
                <Alert variant="destructive" data-testid="alert-reset-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {resetPasswordMutation.error?.message || "Password reset failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetPasswordMutation.isPending}
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
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