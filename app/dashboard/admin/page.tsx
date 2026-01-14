"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDash() {
  const [msg, setMsg] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");

  async function loadAll() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { location.href = "/auth"; return; }

    const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    if (p?.role !== "admin") { setMsg("Поставь роль Админ в кабинете."); return; }

    const { data: s } = await supabase.from("services").select("*").order("created_at", {ascending:false});
    setServices(s ?? []);

    const { data: b } = await supabase.from("bookings").select("*").order("created_at", {ascending:false});
    setBookings(b ?? []);

    const { data: c } = await supabase.from("issue_categories").select("*").order("sort", {ascending:true});
    setCats(c ?? []);
  }

  useEffect(() => { loadAll(); }, []);

  async function toggleService(id: string, is_active: boolean) {
    await supabase.from("services").update({ is_active: !is_active }).eq("id", id);
    await loadAll();
  }

  async function addCategory() {
    if (!newCat) return;
    await supabase.from("issue_categories").insert({ title: newCat, sort: 999, is_active: true });
    setNewCat("");
    await loadAll();
  }

  async function toggleCategory(id: string, is_active: boolean) {
    await supabase.from("issue_categories").update({ is_active: !is_active }).eq("id", id);
    await loadAll();
  }

  return (
    <div className="grid" style={{gap:18}}>
      <div className="card">
        <div style={{fontWeight:900, fontSize:22}}>Админка</div>
        {msg ? <div className="small" style={{marginTop:10}}>{msg}</div> : null}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Категории причин</div>
        <div className="hr" />
        <div className="row">
          <input className="input" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Новая категория" style={{maxWidth:360}} />
          <button className="btn" onClick={addCategory}>Добавить</button>
        </div>
        <div className="hr" />
        {cats.length === 0 ? <div className="small">Пусто</div> : (
          <table className="table">
            <thead><tr><th>Название</th><th>Активна</th><th></th></tr></thead>
            <tbody>
              {cats.map((c:any)=>(
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.is_active ? "да" : "нет"}</td>
                  <td><button className="btn2" onClick={()=>toggleCategory(c.id, c.is_active)}>{c.is_active ? "Выключить" : "Включить"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Сервисы (модерация)</div>
        <div className="hr" />
        {services.length === 0 ? <div className="small">Пока нет.</div> : (
          <table className="table">
            <thead><tr><th>Создано</th><th>Название</th><th>Город</th><th>Активен</th><th></th></tr></thead>
            <tbody>
              {services.map((s:any)=>(
                <tr key={s.id}>
                  <td>{new Date(s.created_at).toLocaleString("ru-RU")}</td>
                  <td>{s.name} <span className="small">(/services/{s.slug})</span></td>
                  <td>{s.city}</td>
                  <td>{s.is_active ? "да" : "нет"}</td>
                  <td><button className="btn2" onClick={()=>toggleService(s.id, s.is_active)}>{s.is_active ? "Скрыть" : "Показать"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Все заявки в сервисы</div>
        <div className="hr" />
        {bookings.length === 0 ? <div className="small">Пока нет.</div> : (
          <table className="table">
            <thead><tr><th>Создано</th><th>Город</th><th>Статус</th><th>Авто</th><th>Срочно</th></tr></thead>
            <tbody>
              {bookings.map((b:any)=>(
                <tr key={b.id}>
                  <td>{new Date(b.created_at).toLocaleString("ru-RU")}</td>
                  <td>{b.city}</td>
                  <td>{b.status}</td>
                  <td>{b.car_brand} {b.car_model} ({b.plate})</td>
                  <td>{b.is_urgent ? "да" : "нет"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
