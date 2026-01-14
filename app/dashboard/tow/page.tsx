"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TowRequest = {
  id: string;
  created_at: string;
  status: "open" | "chosen" | "closed" | "cancelled";
  city: string;
  from_address: string;
  to_address: string;
  car_type: string;
  can_roll: boolean;
  note: string | null;
};

export default function TowDashboardPage() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [requests, setRequests] = useState<TowRequest[]>([]);
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [comment, setComment] = useState("");

  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        location.href = "/auth";
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.user.id)
        .maybeSingle();

      setRole((p as any)?.role ?? null);
      setReady(true);
    })();
  }, []);

  async function loadRequests() {
    setMsg("");
    const { data, error } = await supabase
      .from("tow_requests")
      .select("id,created_at,status,city,from_address,to_address,car_type,can_roll,note")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    const list = ((data as any) ?? []) as TowRequest[];
    setRequests(list);
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }

  useEffect(() => {
    if (ready && role === "tow") loadRequests();
  }, [ready, role]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return requests;
    return requests.filter((r) => {
      const text = `${r.city} ${r.from_address} ${r.to_address} ${r.car_type} ${r.note ?? ""}`.toLowerCase();
      return text.includes(s);
    });
  }, [requests, search]);

  async function sendOffer() {
    setMsg("");

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      location.href = "/auth";
      return;
    }

    if (!selectedId) {
      setMsg("Выбери заявку");
      return;
    }

    const priceNum = parseInt(price, 10);
    const etaNum = parseInt(eta, 10);

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setMsg("Цена должна быть числом");
      return;
    }
    if (!Number.isFinite(etaNum) || etaNum <= 0) {
      setMsg("Время подачи (мин) должно быть числом");
      return;
    }

    const { error } = await supabase.from("tow_offers").insert({
      request_id: selectedId,
      tow_profile_id: u.user.id,
      price: priceNum,
      eta_minutes: etaNum,
      comment: comment.trim() || null
    } as any);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Предложение отправлено ✅");
    setPrice("");
    setEta("");
    setComment("");
  }

  if (!ready) {
    return (
      <div className="card">
        <div style={{ fontWeight: 900, fontSize: 20 }}>Эвакуатор</div>
        <div className="small" style={{ marginTop: 10 }}>Загрузка...</div>
      </div>
    );
  }

  if (role !== "tow") {
    return (
      <div className="card">
        <div style={{ fontWeight: 900, fontSize: 20 }}>Эвакуатор</div>
        <div className="small" style={{ marginTop: 10 }}>
          Эта страница только для роли "Эвакуаторщик".
        </div>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Заявки на эвакуатор</div>
            <div className="small">Выбирай заявку и отправляй предложение</div>
          </div>
          <button className="btn2" onClick={loadRequests}>Обновить</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Поиск</div>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="город, адрес, тип авто..."
          />
        </div>

        <div className="hr" />

        <table className="table">
          <thead>
            <tr>
              <th>Статус</th>
              <th>Город</th>
              <th>Откуда</th>
              <th>Куда</th>
              <th>Авто</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.status}</td>
                <td>{r.city}</td>
                <td>{r.from_address}</td>
                <td>{r.to_address}</td>
                <td>{r.car_type}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {msg ? <div className="small" style={{ marginTop: 12 }}>{msg}</div> : null}
      </div>

      <div className="card">
        <div style={{ fontWeight: 900, fontSize: 20 }}>Отправить предложение</div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Заявка</div>
          <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Выбери заявку</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.city} | {r.car_type} | {r.from_address.slice(0, 18)}...
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid2" style={{ marginTop: 12 }}>
          <div>
            <div className="small">Цена (руб.)</div>
            <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="например: 4500" />
          </div>
          <div>
            <div className="small">Подача (мин.)</div>
            <input className="input" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="например: 25" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Комментарий (необязательно)</div>
          <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="например: приеду за 20 минут, цена фикс" />
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={sendOffer}>Отправить</button>
        </div>
      </div>
    </div>
  );
}
