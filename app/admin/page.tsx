"use client";

// ============================================================
//  /admin - «дарвоза»-и панели идора.
//  Танҳо корбари "admin" мебинад. Дигарон -> /Auth/login.
//  Санҷиш дар браузер (токен дар localStorage аст).
// ============================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { getToken, readToken, LOGIN_PATH } from "@/lib/auth";
import { AdminDashboard } from "./components/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    queueMicrotask(() => {
      const token = getToken();
      const user = token ? readToken(token) : null;

      if (user !== null && user.userName === "admin") {
        setState("ok");
      } else {
        router.replace(LOGIN_PATH);
      }
    });
  }, [router]);

  if (state === "checking") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2 className="h-7 w-7 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  return <AdminDashboard />;
}
