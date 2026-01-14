"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function ServiceDash() {
  const [me, setMe] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [msg, setMsg] = useState("");

  // поля сервиса
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [desc, setDesc] = useState("");
  const [active, setActive] = useState(false);

  // услуги
  const [offers, setOffers] = useState<any[]>([]);
  const [offerTitle, setOfferTitle] = useState("");
  const [pf, setPf] = useState("");
  const [pt, setPt] = useState("");

  // расписание
  const [hours, setHours] = useState<any[]>([]);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotMin, setSlotMin] = useState(30);

  // заявки
  const [bookings, setBookings] = useState<any[]>([]);

  async function loadAll() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { location.href = "/auth"; return; }

    const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    setMe(p);

    if (p?.role !== "service") {
      setMsg("Поставь роль Автосервис в кабинете.");
      return;
    }

    const { data: s } = await supabase.from("services").select("*").eq("owner_id", u.user.id).maybeSingle();
    setService(s);

    if (s) {
      setName(s.name ?? "");
      setSlug(s.slug ?? "");
      setCity(s.city ?? "");
      setAddress(s.address ?? "");
      setPhone(s.phone ?? "");
      setEmail(s.email ?? "");
      setDesc(s.description ?? "");
      setActive(!!s.is_active);

      const { data: o } = await supabase.from("service_offers").select("*").eq("service_id", s.id).order("title", {ascending:true});
      setOffers(o ?? []);

      const { data: h } = await supabase.from("service_working_hours").select("*").eq("service_id", s.id).order("weekday", {ascending:true});
      setHours(h ?? []);

      const { data: b } = await supabase.from("bookings").select("*").eq("service_id", s.id).order("created_at", {ascending:false});
      setBookings(b ?? []);
    } else {
      // подтянем город/имя из профиля
      setCity(p?.city ?? "");
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function createOrUpdateService() {
    try {
      setMsg("");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      if (!name || !city || !email) throw new Error("Нужно заполнить: название, город, email");
      const finalSlug = slug || slugify(name);

      if (!service) {
        const { error } = await supabase.from("services").insert({
          owner_id: u.user.id,
          slug: finalSlug,
          name,
          city,
          address: address || null,
          phone: phone || null,
          email,
          description: desc || null,
          is_active: active
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").update({
          slug: finalSlug,
          name,
          city,
          address: address || null,
          phone: phone || null,
          email,
          description: desc || null,
          is_active: active
        }).eq("id", service.id);
        if (error) throw error;
      }

      setMsg("Сохранено.");
      await loadAll();
    } catch (e:any) {
      setMsg(e.message ?? "Ошибка");
    }
  }

  async function addOffer() {
    if (!service) { setMsg("Сначала сохрани сервис."); return; }
    if (!offerTitle) { setMsg("Укажи название услуги"); return; }

    await supabase.from("service_offers").insert({
      service_id: service.id,
      title: offerTitle,
      price_from: pf ? Number(pf) : null,
      price_to: pt ? Number(pt) : null
    });

    setOfferTitle(""); setPf(""); setPt("");
    await loadAll();
  }

  async function deleteOffer(id: string) {
    await supabase.from("service_offers").delete().eq("id", id);
    await loadAll();
  }

  async function addHours() {
    if (!service) { setMsg("Сначала сохрани сервис."); return; }
    await supabase.from("service_working_hours").insert({
      service_id: service.id,
      weekday,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      slot_minutes: slotMin
    });
    await loadAll();
  }

  async function deleteHours(id: string) {
    await supabase.from("service_working_hours").delete().eq("id", id);
    await loadAll();
  }

  async function updateBookingStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    await loadAll();
  }

  return (
    <div className="grid" style={{gap:18}}>
      <div className="card">
        <div style={{fontWeight:900, fontSize:22}}>Панель автосервиса</div>
        <div className="small">Заполни страницу, услуги и расписание. После этого люди смогут записываться.</div>
        {msg ? <div className="small" style={{marginTop:10}}>{msg}</div> : null}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>1) Страница сервиса</div>
        <div className="hr" />

        <div className="grid grid2">
          <div>
            <div className="small">Название</div>
            <input className="input" value={name} onChange={e=>{setName(e.target.value); if(!slug) setSlug(slugify(e.target.value));}} />
          </div>
          <div>
            <div className="small">Ссылка (slug)</div>
            <input className="input" value={slug} onChange={e=>setSlug(e.target.value)} placeholder="например: service-premium" />
            <div className="small" style={{marginTop:6}}>Будет так: /services/{slug || "..."}</div>
          </div>
          <div>
            <div className="small">Город</div>
            <input className="input" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div>
            <div className="small">Email (обязательно)</div>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <div className="small">Телефон</div>
            <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <div className="small">Адрес</div>
            <input className="input" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <div className="small">Описание</div>
          <textarea className="textarea" value={desc} onChange={e=>setDesc(e.target.value)} />
        </div>

        <div style={{marginTop:12}} className="row">
          <label className="badge" style={{cursor:"pointer"}}>
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            Активен (виден на главной)
          </label>
          <button className="btn" onClick={createOrUpdateService}>Сохранить</button>
          {service?.slug ? <a className="btn2" href={`/services/${service.slug}`}>Открыть страницу</a> : null}
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>2) Услуги и цены</div>
        <div className="hr" />

        <div className="grid grid3">
          <div>
            <div className="small">Название услуги</div>
            <input className="input" value={offerTitle} onChange={e=>setOfferTitle(e.target.value)} placeholder="Диагностика" />
          </div>
          <div>
            <div className="small">Цена от</div>
            <input className="input" value={pf} onChange={e=>setPf(e.target.value)} placeholder="1000" />
          </div>
          <div>
            <div className="small">Цена до</div>
            <input className="input" value={pt} onChange={e=>setPt(e.target.value)} placeholder="3000" />
          </div>
        </div>
        <div style={{marginTop:12}} className="row">
          <button className="btn" onClick={addOffer}>Добавить услугу</button>
        </div>

        <div className="hr" />
        {offers.length === 0 ? <div className="small">Пока пусто.</div> : (
          <table className="table">
            <thead><tr><th>Услуга</th><th>Цена</th><th></th></tr></thead>
            <tbody>
              {offers.map((o:any)=>(
                <tr key={o.id}>
                  <td>{o.title}</td>
                  <td>{o.price_from || o.price_to ? `от ${o.price_from ?? "?"} до ${o.price_to ?? "?"}` : "по запросу"}</td>
                  <td><button className="btn2" onClick={()=>deleteOffer(o.id)}>Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>3) Расписание (слоты)</div>
        <div className="hr" />

        <div className="grid grid3">
          <div>
            <div className="small">День недели</div>
            <select className="select" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>
              <option value={1}>Пн</option>
              <option value={2}>Вт</option>
              <option value={3}>Ср</option>
              <option value={4}>Чт</option>
              <option value={5}>Пт</option>
              <option value={6}>Сб</option>
              <option value={0}>Вс</option>
            </select>
          </div>
          <div>
            <div className="small">Начало</div>
            <input className="input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} />
          </div>
          <div>
            <div className="small">Конец</div>
            <input className="input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} />
          </div>
          <div>
            <div className="small">Шаг слота</div>
            <select className="select" value={slotMin} onChange={e=>setSlotMin(Number(e.target.value))}>
              <option value={30}>30 минут</option>
              <option value={60}>60 минут</option>
            </select>
          </div>
        </div>

        <div style={{marginTop:12}} className="row">
          <button className="btn" onClick={addHours}>Добавить расписание</button>
        </div>

        <div className="hr" />
        {hours.length === 0 ? <div className="small">Пока не задано расписание.</div> : (
          <table className="table">
            <thead><tr><th>День</th><th>Время</th><th>Слот</th><th></th></tr></thead>
            <tbody>
              {hours.map((h:any)=>(
                <tr key={h.id}>
                  <td>{["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][h.weekday]}</td>
                  <td>{h.start_time} - {h.end_time}</td>
                  <td>{h.slot_minutes} мин</td>
                  <td><button className="btn2" onClick={()=>deleteHours(h.id)}>Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{fontWeight:900}}>4) Заявки</div>
        <div className="hr" />
        {bookings.length === 0 ? <div className="small">Пока нет заявок.</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Создано</th>
                <th>Статус</th>
                <th>Авто</th>
                <th>Слот</th>
                <th>Срочно</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b:any)=>(
                <tr key={b.id}>
                  <td>{new Date(b.created_at).toLocaleString("ru-RU")}</td>
                  <td>{b.status}</td>
                  <td>{b.car_brand} {b.car_model} ({b.plate})</td>
                  <td>{b.desired_at ? new Date(b.desired_at).toLocaleString("ru-RU") : "не выбран"}</td>
                  <td>{b.is_urgent ? "да" : "нет"}</td>
                  <td className="row">
                    <button className="btn2" onClick={()=>updateBookingStatus(b.id, "confirmed")}>Подтвердить</button>
                    <button className="btn2" onClick={()=>updateBookingStatus(b.id, "cancelled")}>Отменить</button>
                    <button className="btn2" onClick={()=>updateBookingStatus(b.id, "done")}>Готово</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
