"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  return (
    <div className="nav">
      <div className="brand">
        <div className="logo" />
        <div>
          <div style={{ fontWeight: 900 }}>WrenchMarket</div>
          <div className="small">агрегатор автосервисов и эвакуаторов</div>
        </div>
      </div>

      <div className="row">
        <Link className="btn2" href="/urgent">Срочно</Link>
        <Link className="btn2" href="/tow">Эвакуатор</Link>
        <Link className="btn2" href="/dashboard">Кабинет</Link>
        {!user ? (
          <Link className="btn" href="/auth">Войти</Link>
        ) : (
          <button className="btn" onClick={logout}>Выйти</button>
        )}
      </div>
    </div>
  );
}
