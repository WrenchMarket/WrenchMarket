"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Завершаю вход...");

  useEffect(() => {
    let unsub: null | (() => void) = null;

    (async () => {
      try {
        // 1) Вариант PKCE (?code=...)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 2) Вариант magic-link с #access_token=...
        // supabase-js сам подхватывает сессию из URL после загрузки страницы.
        // Подождём событие и/или проверим сессию.
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN") {
            setMsg("Готово. Перенаправляю в кабинет...");
            window.location.replace("/dashboard");
          }
        });
        unsub = () => data.subscription.unsubscribe();

        // Доп.страховка: через 600мс проверим, появилась ли сессия
        setTimeout(async () => {
          const { data: s } = await supabase.auth.getSession();
          if (s.session) {
            setMsg("Готово. Перенаправляю в кабинет...");
            window.location.replace("/dashboard");
          } else {
            setMsg("Ссылка открылась, но сессия не создалась. Попробуй открыть ссылку из письма в обычном браузере (не во встроенном).");
          }
        }, 600);
      } catch (e: any) {
        setMsg(e?.message || "Не получилось завершить вход. Попробуй ещё раз.");
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <div className="card">
      <div style={{ fontWeight: 900, fontSize: 20 }}>Вход</div>
      <div className="small" style={{ marginTop: 10 }}>{msg}</div>
    </div>
  );
}
