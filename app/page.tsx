"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Service = {
  id: string; slug: string; name: string; city: string; address?: string | null; description?: string | null; is_active: boolean;
};

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase
      .from("services")
      .select("id,slug,name,city,address,description,is_active")
      .eq("is_active", true)
      .then(({ data }) => setServices((data as any) ?? []));
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const okCity = city ? s.city.toLowerCase().includes(city.toLowerCase()) : true;
      const text = `${s.name} ${s.city} ${s.address ?? ""} ${s.description ?? ""}`.toLowerCase();
      const okQ = query ? text.includes(query.toLowerCase()) : true;
      return okCity && okQ;
    });
  }, [services, city, query]);

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <div className="h1">Запись в автосервис без звонков</div>
        <div className="h2">
          Выбираешь сервис, слот, описываешь проблему, прикрепляешь фото или видео. Сервис перезванивает и подтверждает.
        </div>

        <div className="grid grid2">
          <div>
            <div className="small">Город</div>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="например: Москва" />
          </div>
          <div>
            <div className="small">Поиск по сервисам/услугам</div>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="например: диагностика, тормоза, BMW" />
          </div>
        </div>
      </div>

      <div className="grid grid3">
        {filtered.map((s) => (
          <Link key={s.id} href={`/services/${s.slug}`} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{s.name}</div>
              <div className="badge">{s.city}</div>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              {s.address ?? "Адрес не указан"}
            </div>
            <div className="hr" />
            <div className="small">
              {s.description ?? "Описания пока нет"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
