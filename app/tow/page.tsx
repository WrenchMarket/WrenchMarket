"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TowPage() {
  const [city, setCity] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [carType, setCarType] = useState("Легковая");
  const [canRoll, setCanRoll] = useState(true);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [offersByReq, setOffersByReq] = useState<Record<string, any[]>>({});

  async function loadMy() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: r } = await supabase.from("tow_requests").select("*").order("created_at", {ascending:false});
    const mine = (r ?? []).filter((x:any)=>x.client_id === u.user.id);
    setMyRequests(mine);

    const map: Record<string, any[]> = {};
    for (const req of mine) {
      const { data: o } = await supabase.from("tow_offers").select("*").eq("request_id", req.id).order("price", {ascending:true});
      map[req.id] = o ?? [];
    }
    setOffersByReq(map);
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (p?.city) setCity(p.city);
      await loadMy();
    })();
  }, []);

  async function createRequest() {
    try {
      setMsg("");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { location.href = "/auth"; return; }

      const finalCity = city;
      if (!finalCity) throw new Error("Укажи город");
      if (!fromAddr || !toAddr) throw new Error("Укажи адрес откуда и куда");

      const { error } = await supabase.from("tow_requests").insert({
        client_id: u.user.id,
        city: finalCity,
        from_address: fromAddr,
        to_address: toAddr,
        car_type: carType,
        can_roll: canRoll,
        note: note || null
      });
      if (error) throw error;

      setMsg("Заявка создана. Жди предложения эвакуаторщиков.");
      setFromAddr(""); setToAddr(""); setNote("");
      await loadMy();
    } catch (e:any) {
      setMsg(e.message ?? "Ошибка");
    }
  }

  async function selectOffer(requestId: string, offerId: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { location.href = "/auth"; return; }

    // снимаем выделение со всех, ставим на выбранный
    const offers = offersByReq[requestId] ?? [];
    for (const o of offers) {
      await supabase.from("tow_offers").update({ is_selected: o.id === offerId }).eq("id", o.id);
    }
    await supabase.from("tow_requests").update({ status: "chosen" }).eq("id", requestId);

    await loadMy();
  }

  return (
    <div className="grid" style={{gap:18}}>
      <div className="card">
        <div className="h1" style={{fontSize:28}}>Эвакуатор</div>
        <div className="h2">Создаёшь заявку. Эвакуаторщики в городе присылают цену и время подачи. Ты выбираешь лучшее.</div>

        <div className="grid grid2">
          <div>
            <div className="small">Город</div>
            <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Москва" />
          </div>
          <div>
            <div className="small">Тип авто</div>
            <select className="select" value={carType} onChange={e=>setCarType(e.target.value)}>
              <option>Легковая</option>
              <option>Кроссовер</option>
              <option>Минивэн</option>
              <option>Грузовая</option>
            </select>
          </div>
        </div>

        <div className="grid grid2" style={{marginTop:12}}>
          <div>
            <div className="small">Откуда</div>
            <input className="input" value={fromAddr} onChange={e=>setFromAddr(e.target.value)} placeholder="адрес" />
          </div>
          <div>
            <div className="small">Куда</div>
            <input className="input" value={toAddr} onChange={e=>setToAddr(e.target.value)} placeholder="адрес" />
          </div>
        </div>

        <div style={{marginTop:12}} className="row">
          <label className="badge" style={{cursor:"pointer"}}>
            <input type="checkbox" checked={canRoll} onChange={e=>setCanRoll(e.target.checked)} />
            Машина может катиться
          </label>
        </div>

        <div style={{marginTop:12}}>
          <div className="small">Комментарий</div>
          <textarea className="textarea" value={note} onChange={e=>setNote(e.target.value)} placeholder="например: подземный паркинг, низкий клиренс..." />
        </div>

        <div style={{marginTop:12}} className="row">
          <button className="btn" onClick={createRequest}>Создать заявку</button>
        </div>

        {msg ? <div className="small" style={{marginTop:12}}>{msg}</div> : null}
      </div>

      <div className="card">
        <div style={{fontWeight:900, fontSize:18}}>Мои заявки</div>
        <div className="hr" />
        {myRequests.length === 0 ? (
          <div className="small">Пока пусто.</div>
        ) : myRequests.map((r:any)=>(
          <div key={r.id} className="card" style={{marginTop:12}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div style={{fontWeight:900}}>{r.city} · {r.car_type}</div>
              <div className="badge">статус: {r.status}</div>
            </div>
            <div className="small" style={{marginTop:8}}>
              Откуда: {r.from_address}<br/>
              Куда: {r.to_address}<br/>
              Катится: {r.can_roll ? "да" : "нет"}
            </div>

            <div className="hr" />
            <div style={{fontWeight:900}}>Предложения</div>
            {(offersByReq[r.id] ?? []).length === 0 ? (
              <div className="small" style={{marginTop:8}}>Пока нет предложений.</div>
            ) : (
              <table className="table" style={{marginTop:8}}>
                <thead>
                  <tr>
                    <th>Цена</th>
                    <th>Подача</th>
                    <th>Комментарий</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(offersByReq[r.id] ?? []).map((o:any)=>(
                    <tr key={o.id}>
                      <td>{o.price}</td>
                      <td>{o.eta_minutes} мин</td>
                      <td>{o.comment ?? ""}</td>
                      <td>
                        {o.is_selected ? (
                          <span className="badge">выбрано</span>
                        ) : (
                          <button className="btn2" onClick={()=>selectOffer(r.id, o.id)} disabled={r.status !== "open"}>
                            Выбрать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
