"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function PushButton({ className = "" }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
    });
  }, []);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setSubscribed(false);
      } else {
        const res  = await fetch("/api/notifications/subscribe");
        const { vapidPublicKey } = await res.json();
        if (!vapidPublicKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub }),
        });
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Unsubscribe from notifications" : "Get push notifications"}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        subscribed
          ? "text-indigo-400 hover:text-indigo-300"
          : "text-slate-500 hover:text-slate-300"
      } ${className}`}
    >
      {subscribed ? <Bell className="h-4 w-4 fill-current" /> : <BellOff className="h-4 w-4" />}
      <span className="hidden sm:inline">{subscribed ? "Notifications on" : "Notify me"}</span>
    </button>
  );
}
