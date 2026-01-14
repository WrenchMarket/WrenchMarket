"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [role, setRole] = useState<string>("client");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { location.href = "/auth"; return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();

      if (!p) {
        await supabase.from("profiles").insert({
          id: u.user.id,
          role: "client",
          phone: u.user.phone ?? null,
          email: u.user.email ?? null
        });
        setRole("client");
      } else {
        setRole(p.role);
        setFullName(p.full_name ?? "");
        setCity(p.city ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("profiles").update({ full_name: fullName, city }).eq("id", u.user.id);
    alert("Сохранено");
  }

  async function setUserRole(r: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("profiles").update({ role: r }).eq("id", u.user.id);
    location.reload();
  }

  if (loading) return <div className="card">Загрузка...</div>;

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Личный кабинет</div>
            <div className="small">Роль: <b>{role}</b></div>
          </div>

          <div className="row">
            <button className="btn2" onClick={() => setUserRole("client")}>Клиент</button>
            <button className="btn2" onClick={() => setUserRole("service")}>Автосервис</button>
            <button className="btn2" onClick={() => setUserRole("tow")}>Эвакуаторщик</button>
            <button className="btn2" onClick={() => setUserRole("admin")}>Админ</button>
          </div>
        </div>

        <div className="hr" />

        <div className="grid grid2">
          <div>
            <div className="small">Имя</div>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="как к вам обращаться" />
          </div>
          <div>
            <div className="small">Город</div>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={saveProfile}>Сохранить</button>
        </div>
      </div>

      {role === "service" ? (
        <Link className="card" href="/dashboard/service">
          <div style={{ fontWeight: 900 }}>Панель автосервиса</div>
          <div className="small">Страница сервиса, услуги, расписание, заявки</div>
        </Link>
      ) : null}

      {role === "tow" ? (
        <Link className="card" href="/dashboard/tow">
          <div style={{ fontWeight: 900 }}>Панель эвакуаторщика</div>
          <div className="small">Торги и предложения</div>
        </Link>
      ) : null}

      {role === "admin" ? (
        <Link className="card" href="/dashboard/admin">
          <div style={{ fontWeight: 900 }}>Админка</div>
          <div className="small">Модерация сервисов, категории, заявки</div>
        </Link>
      ) : null}
    </div>
  );
}
