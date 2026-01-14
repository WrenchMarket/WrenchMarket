"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { buildSlotsForDay, slotIntersectsBlackout } from "@/lib/slots";

export default function ServicePage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  const [service, setService] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [blackouts, setBlackouts] = useState<any[]>([]);

  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotISO, setSlotISO] = useState<string>("");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [problem, setProblem] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("services").select("*").eq("slug", slug).maybeSingle();
      setService(s);

      if (s?.id) {
        const { data: o } = await supabase.from("service_offers").select("*").eq("service_id", s.id);
        setOffers(o ?? []);
        const { data: h } = await supabase.from("service_working_hours").select("*").eq("service_id", s.id);
        setHours(h ?? []);
        const { data: b } = await supabase.from("service_blackouts").select("*").eq("service_id", s.id);
        setBlackouts(b ?? []);
      }

      const { data: c } = await supabase
        .from("issue_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort", { ascending: true });
      setCategories(c ?? []);
    })();
  }, [slug]);

  const daySlots = useMemo(() => {
    if (!service) return [];
    const weekday = new Date(`${dateISO}T00:00:00`).getDay(); // 0..6
    const wh = hours.find((x) => x.weekday === weekday);
    if (!wh) return [];
    const slots = buildSlotsForDay({ dateISO, start: wh.start_time, end: wh.end_time, slotMinutes: wh.slot_minutes });
    return slots.filter((s) => !slotIntersectsBlackout(s, blackouts, wh.slot_minutes));
  }, [service, hours, blackouts, dateISO]);

  async function uploadMedia() {
    const uploaded: any[] = [];
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Нужно войти");

    for (const f of photos.slice(0, 4)) {
      const path = `bookings/${u.user.id}/${Date.now()}_${f.name}`;
      const { error } = await supabase.storage.from("uploads").upload(path, f, { upsert: false });
      if (error) throw error;
      uploaded.push({ type: "photo", path, name: f.name, size: f.size });
    }

    if (video) {
      if (video.size > 25 * 1024 * 1024) throw new Error("Видео больше 25 МБ");
      const path = `bookings/${u.user.id}/${Date.now()}_${video.name}`;
      const { error } = await supabase.storage.from("uploads").upload(path, video, { upsert: false });
      if (error) throw error;
      uploaded.push({ type: "video", path, name: video.name, size: video.size });
    }

    return uploaded;
  }

  async function submit() {
    try {
      setMsg("");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { location.href = "/auth"; return; }

      if (!slotISO) throw new Error("Выбери время");
      if (!brand || !model || !plate || !problem) throw new Error("Заполни обязательные поля");

      const media = await uploadMedia();

      const { error } = await supabase.from("bookings").insert({
        client_id: u.user.id,
        service_id: service.id,
        city: service.city,
        desired_at: slotISO,
        is_urgent: urgent,
        car_brand: brand,
        car_model: model,
        plate,
        vin: vin || null,
        category_id: categoryId || null,
        problem_text: problem,
        media
      });

      if (error) throw error;

      setMsg("Готово! Заявка отправлена. Сервис перезвонит для подтверждения.");
      setBrand(""); setModel(""); setPlate(""); setVin(""); setProblem(""); setCategoryId(""); setUrgent(false);
      setPhotos([]); setVideo(null); setSlotISO("");
    } catch (e: any) {
      setMsg(e.message ?? "Ошибка");
    }
  }

  if (!service) return <div className="card">Сервис не найден</div>;

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="h1" style={{ fontSize: 30 }}>{service.name}</div>
            <div className="h2">{service.city}{service.address ? ` · ${service.address}` : ""}</div>
          </div>
          <div className="badge">перезвонят для подтверждения</div>
        </div>

        <div className="hr" />
        <div className="small">{service.description ?? "Описание сервиса появится позже."}</div>

        <div className="hr" />
        <div style={{ fontWeight: 900 }}>Услуги</div>
        <div className="grid grid3" style={{ marginTop: 10 }}>
          {(offers ?? []).slice(0, 9).map((o: any) => (
            <div key={o.id} className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 900 }}>{o.title}</div>
              <div className="small">
                {o.price_from || o.price_to ? `от ${o.price_from ?? "?"} до ${o.price_to ?? "?"}` : "цена по запросу"}
              </div>
            </div>
          ))}
          {offers.length === 0 ? <div className="small">Услуги пока не заполнены.</div> : null}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 900, fontSize: 20 }}>Запись</div>
        <div className="small">Фото до 4. Видео до 25 МБ.</div>

        <div className="hr" />

        <div className="grid grid2">
          <div>
            <div className="small">Дата</div>
            <input className="input" type="date" value={dateISO} onChange={(e) => { setDateISO(e.target.value); setSlotISO(""); }} />
          </div>

          <div>
            <div className="small">Время</div>
            <select className="select" value={slotISO} onChange={(e) => setSlotISO(e.target.value)}>
              <option value="">Выбери слот</option>
              {daySlots.map((s) => (
                <option key={s} value={s}>
                  {new Date(s).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </option>
              ))}
            </select>
            {daySlots.length === 0 ? <div className="small" style={{ marginTop: 6 }}>На этот день нет слотов (сервис не настроил расписание).</div> : null}
          </div>
        </div>

        <div className="grid grid2" style={{ marginTop: 12 }}>
          <div>
            <div className="small">Марка</div>
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" />
          </div>
          <div>
            <div className="small">Модель</div>
            <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" />
          </div>
          <div>
            <div className="small">Госномер</div>
            <input className="input" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="A123BC77" />
          </div>
          <div>
            <div className="small">VIN (если нужно запчасти)</div>
            <input className="input" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="необязательно" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Причина</div>
          <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Выбери категорию</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="small">Описание проблемы</div>
          <textarea className="textarea" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Что случилось, когда началось, симптомы..." />
        </div>

        <div className="grid grid2" style={{ marginTop: 12 }}>
          <div>
            <div className="small">Фото (до 4)</div>
            <input className="input" type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 4))} />
            <div className="small" style={{ marginTop: 6 }}>{photos.length ? `Выбрано фото: ${photos.length}` : "Не выбрано"}</div>
          </div>
          <div>
            <div className="small">Видео (1 файл)</div>
            <input className="input" type="file" accept="video/*" onChange={(e) => setVideo((e.target.files?.[0]) ?? null)} />
            <div className="small" style={{ marginTop: 6 }}>{video ? `Видео: ${video.name}` : "Не выбрано"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="row">
          <label className="badge" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            Срочно (и всем сервисам в городе)
          </label>
          <button className="btn" onClick={submit}>Отправить заявку</button>
        </div>

        {msg ? <div className="small" style={{ marginTop: 12 }}>{msg}</div> : null}
      </div>
    </div>
  );
}
