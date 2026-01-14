"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [msg, setMsg] = useState("");

  async function sendCode() {
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setMsg(error.message);
    else {
      setStep("otp");
      setMsg("Код отправлен по SMS");
    }
  }

  async function verify() {
    setMsg("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms"
    });
    if (error) setMsg(error.message);
    else location.href = "/dashboard";
  }

  return (
    <div className="card">
      <div className="h1" style={{ fontSize: 28 }}>Вход</div>
      <div className="h2">По номеру телефона. Придёт код по SMS.</div>

      {step === "phone" ? (
        <>
          <div className="small">Телефон (международный формат)</div>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+79991234567" />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={sendCode}>Отправить код</button>
          </div>
        </>
      ) : (
        <>
          <div className="small">Код из SMS</div>
          <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="например: 123456" />
          <div style={{ marginTop: 12 }} className="row">
            <button className="btn" onClick={verify}>Войти</button>
            <button className="btn2" onClick={() => setStep("phone")}>Назад</button>
          </div>
        </>
      )}

      {msg ? <div className="small" style={{ marginTop: 12 }}>{msg}</div> : null}
    </div>
  );
}
