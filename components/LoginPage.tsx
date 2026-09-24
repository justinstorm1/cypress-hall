import { GraduationCap, MessagesSquare } from "lucide-react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { useAuthActions } from '@convex-dev/auth/react';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3446 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29c.7077-2.1273 2.6914-3.7105 5.036-3.7105z"
      />
    </svg>
  );
}

export default function LoginPage() {
    const { signIn } = useAuthActions();

    const handleGoogleSignIn = async () => {
        try {
            await signIn("google");
        } catch (error) {
            console.error("Failed to sign in with Google:", error);
        }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessagesSquare className="size-6" />
          </div>
          <CardTitle className="text-xl">Welcome to Cypresshall</CardTitle>
          <CardDescription>
            Anonymous posting, only for NJIT students.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center gap-3 px-3"
            onClick={handleGoogleSignIn}
          >
            <GoogleLogo />
            Sign in with Google
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="size-3.5" />
            Restricted to @njit.edu email addresses
          </div>
        </CardContent>

        <CardFooter className="justify-center bg-transparent p-4 text-center text-xs text-muted-foreground">
          Posts are anonymous to other students. Your NJIT identity is only
          ever used to verify enrollment.
        </CardFooter>
      </Card>
    </div>
  );
}
