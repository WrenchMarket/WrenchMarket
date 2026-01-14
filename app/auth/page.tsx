"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function sendLink() {
    setMsg("");

    const e = email.trim();
    if (!e.includes("@")) {
      setMsg("Введи email, например: you@mail.com");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: redirectTo }
    });

    if (error) setMsg(error.message);
    else setMsg("Готово. Я отправил письмо со ссылкой для входа. Проверь почту.");
  }

  return (
    <div className="card">
      <div className="h1" style={{ fontSize: 28 }}>Вход</div>
      <div className="h2">По email. Мы пришлём ссылку, по ней ты зайдёшь в кабинет.</div>

      <div className="small">Email</div>
      <input
        className="input"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        placeholder="you@mail.com"
      />

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={sendLink}>Отправить ссылку</button>
      </div>

      {msg ? <div className="small" style={{ marginTop: 12 }}>{msg}</div> : null}
    </div>
  );
}
