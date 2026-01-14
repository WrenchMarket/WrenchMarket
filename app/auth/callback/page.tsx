"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Завершаю вход...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        setMsg("Готово, перенаправляю в кабинет...");
        window.location.href = "/dashboard";
      } catch (e: any) {
        setMsg(e?.message || "Не получилось завершить вход. Попробуй ещё раз.");
      }
    })();
  }, []);

  return (
    <div className="card">
      <div style={{ fontWeight: 900, fontSize: 20 }}>Вход</div>
      <div className="small" style={{ marginTop: 10 }}>{msg}</div>
    </div>
  );
}
