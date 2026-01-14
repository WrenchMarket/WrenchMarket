"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TowDash() {
  const [msg, setMsg] = useState("");
  const [city, setCity] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);

  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("25");
  const [comment, setComment] = useState("");
  const [selectedReq, setSelectedReq] = useState<string>("");

  async function loadAll() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { location.href = "/auth"; return; }

    const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    if (p?.role !== "tow") { setMsg("Поставь роль Эвакуаторщик в кабинете."); return; }
    setCity(p?.city ?? "");

    const { data: r } = await supabase.from("tow_requests").select("*").order("created_at", {ascending:false});
    const list = (r ?? []).filter((x:any)=>!p?.city || x.city === p.city);
    setRequests(list);

    const { data: o } = await supabase.from("tow_offers").select("*").eq("tow_profile_id", u.user.id).order("created_at", {ascending:false});
    setMyOffers(o ?? []);
  }

  useEffect(() => { loadAll(); }, []);

  async function makeOffer() {
    try {
      setMsg("");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (!selectedReq) throw new Error("Выбери заявку");
      if (!price || !eta) throw new Error("Укажи цену и время подачи");

      const { error } = await supabase.from("tow_offers").insert({
        request_id: selectedReq,
        tow_profile_id: u.user.id,
        price: Number(price),
        eta_minutes: Number(eta),
        comment: comment || null
      });
      if (error) throw error;

      setMsg("Предложение отправлено.");
      setPrice(""); setComment("");
      await loadAll();
    } catch (e:any) {
      setMsg(e.message ?? "Ошибка");
    }
  }

  return (
    <div className="grid" style={{gap:18}}>
      <div className="card">
        <div style={{fontWeight:900, fontSize:22}}>Панель эвакуаторщика</div>
        <div className="small">Город из профиля: {city || "не задан"}</div>
        {msg ? <div className="small" style={{marginTop:10}}>{msg}</div> : null}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Сделать предложение</div>
        <div className="hr" />
        <div className="grid grid2">
          <div>
            <div className="small">Заявка</div>
            <select className="select" value={selectedReq} onChange={e=>setSelectedReq(e.target.value)}>
              <option value="">Выбери</option>
              {requests.filter(r=>r.status==="open").map((r:any)=>(
                <option key={r.id} value={r.id}>
                  {r.city} · {r.car_type} · {r.from_address} -> {r.to_address}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="small">Цена</div>
            <input className="input" value={price} onChange={e=>setPrice(e.target.value)} placeholder="3000" />
          </div>
          <div>
            <div className="small">Подача (мин)</div>
            <input className="input" value={eta} onChange={e=>setEta(e.target.value)} placeholder="25" />
          </div>
          <div>
            <div className="small">Комментарий</div>
            <input className="input" value={comment} onChange={e=>setComment(e.target.value)} placeholder="могу приехать быстрее" />
          </div>
        </div>
        <div style={{marginTop:12}} className="row">
          <button className="btn" onClick={makeOffer}>Отправить</button>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Открытые заявки в моём городе</div>
        <div className="hr" />
        {requests.filter(r=>r.status==="open").length === 0 ? <div className="small">Пока нет.</div> : (
          <table className="table">
            <thead><tr><th>Создано</th><th>Маршрут</th><th>Авто</th><th>Катится</th></tr></thead>
            <tbody>
              {requests.filter(r=>r.status==="open").map((r:any)=>(
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                  <td>{r.from_address} -> {r.to_address}</td>
                  <td>{r.car_type}</td>
                  <td>{r.can_roll ? "да" : "нет"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>Мои предложения</div>
        <div className="hr" />
        {myOffers.length === 0 ? <div className="small">Пока пусто.</div> : (
          <table className="table">
            <thead><tr><th>Создано</th><th>Цена</th><th>Подача</th><th>Выбрано</th></tr></thead>
            <tbody>
              {myOffers.map((o:any)=>(
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleString("ru-RU")}</td>
                  <td>{o.price}</td>
                  <td>{o.eta_minutes} мин</td>
                  <td>{o.is_selected ? "да" : "нет"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
