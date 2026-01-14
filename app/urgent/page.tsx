"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UrgentPage() {
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [problem, setProblem] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("issue_categories").select("*").eq("is_active", true).order("sort", {ascending:true})
      .then(({data}) => setCategories(data ?? []));
  }, []);

  async function submitUrgent() {
    try {
      setMsg("");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { location.href = "/auth"; return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      const finalCity = city || p?.city;
      if (!finalCity) throw new Error("Укажи город (в кабинете или здесь)");
      if (!brand || !model || !plate || !problem) throw new Error("Заполни обязательные поля");

      const { data: services } = await supabase.from("services").select("id").eq("is_active", true).eq("city", finalCity);
      if (!services || services.length === 0) throw new Error("В этом городе пока нет активных сервисов");

      const rows = services.map((s:any) => ({
        client_id: u.user.id,
        service_id: s.id,
        city: finalCity,
        desired_at: null,
        is_urgent: true,
        car_brand: brand,
        car_model: model,
        plate,
        vin: vin || null,
        category_id: categoryId || null,
        problem_text: problem,
        media: []
      }));

      const { error } = await supabase.from("bookings").insert(rows);
      if (error) throw error;

      setMsg(`Готово! Срочная заявка разослана в сервисы города: ${finalCity}.`);
      setBrand(""); setModel(""); setPlate(""); setVin(""); setProblem(""); setCategoryId("");
    } catch (e:any) {
      setMsg(e.message ?? "Ошибка");
    }
  }

  return (
    <div className="card">
      <div className="h1" style={{fontSize:28}}>Срочно</div>
      <div className="h2">Заявка улетит всем сервисам в выбранном городе. Они перезвонят и предложат время.</div>

      <div className="grid grid2">
        <div>
          <div className="small">Город (если не заполнен в кабинете)</div>
          <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Москва" />
        </div>
        <div>
          <div className="small">Категория</div>
          <select className="select" value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
            <option value="">Выбери</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid2" style={{marginTop:12}}>
        <div>
          <div className="small">Марка</div>
          <input className="input" value={brand} onChange={e=>setBrand(e.target.value)} />
        </div>
        <div>
          <div className="small">Модель</div>
          <input className="input" value={model} onChange={e=>setModel(e.target.value)} />
        </div>
        <div>
          <div className="small">Госномер</div>
          <input className="input" value={plate} onChange={e=>setPlate(e.target.value)} />
        </div>
        <div>
          <div className="small">VIN (необязательно)</div>
          <input className="input" value={vin} onChange={e=>setVin(e.target.value)} />
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div className="small">Описание</div>
        <textarea className="textarea" value={problem} onChange={e=>setProblem(e.target.value)} />
      </div>

      <div style={{marginTop:12}} className="row">
        <button className="btn" onClick={submitUrgent}>Разослать срочно</button>
      </div>

      {msg ? <div className="small" style={{marginTop:12}}>{msg}</div> : null}
    </div>
  );
}
