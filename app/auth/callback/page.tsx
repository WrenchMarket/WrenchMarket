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

        // 1) Если пришёл PKCE-код (?code=...)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 2) Если пришёл magic link через #access_token=...
          // В этом варианте Supabase-js умеет сам достать токены из URL и сохранить сессию
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;

          // Иногда письмо открывают во встроенном браузере и URL "урезается".
          // Тогда data.session будет null.
          if (!data.session) {
            setMsg("Не вижу токенов в ссылке. Открой письмо и нажми ссылку в обычном браузере.");
            return;
          }
        }

        setMsg("Готово. Перенаправляю в кабинет...");
        window.location.replace("/dashboard");
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
