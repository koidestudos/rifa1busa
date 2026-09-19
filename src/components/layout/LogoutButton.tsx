"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

type LogoutButtonProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold" | "outline";
  size?: "md" | "lg" | "xl";
};

export function LogoutButton({
  className,
  variant = "ghost",
  size = "md",
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-label="Sair da conta"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
          router.replace("/login");
          router.refresh();
          window.location.replace("/login");
        });
      }}
    >
      {pending ? "Saindo..." : "Sair"}
    </Button>
  );
}
