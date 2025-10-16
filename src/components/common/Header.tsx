"use client";

import Link from "next/link";
import { GraduationCap, LogIn, LogOut, Menu, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useState } from "react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navLinks = [
  { href: "/#courses", label: "Courses" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/teacher/dashboard", label: "Teacher" },
];

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const renderNavLinks = (isMobile: boolean) =>
    navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => isMobile && setIsSheetOpen(false)}
        className="text-foreground/80 hover:text-foreground transition-colors text-lg md:text-sm font-medium"
      >
        {link.label}
      </Link>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Course Central</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {renderNavLinks(false)}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          {isUserLoading ? (
             <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuItem disabled>
                  <p className="font-medium">{user.displayName || user.email}</p>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn />
                  Log In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  <UserPlus />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 pt-10">
                <Link href="/" className="mb-4 flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl font-bold">Course Central</span>
                </Link>
                {renderNavLinks(true)}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {user ? (
                     <Button variant="ghost" onClick={() => { handleLogout(); setIsSheetOpen(false); }}>
                      <LogOut />
                      Log Out
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" asChild>
                        <Link href="/login" onClick={() => setIsSheetOpen(false)}>
                          <LogIn />
                          Log In
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register" onClick={() => setIsSheetOpen(false)}>
                          <UserPlus />
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
