"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Tabs } from "@/components/ui";
import MessagingSettings from "./MessagingSettings";
import ReadOnlyNotice from "./ReadOnlyNotice";

const TABS = [
  { key: "whatsapp", label: <><MessageCircle size={15} />WhatsApp</> },
  { key: "email", label: <><Mail size={15} />Email</> },
];

/**
 * Configuration: how each brand and location sends WhatsApp messages and email.
 * The open tab is kept in the URL (?tab=email) so a refresh or shared link lands on it.
 */
export default function SettingsView() {
  const { can } = useAuth();
  const canManage = can(P.SETTINGS_MANAGE);
  const [tab, setTab] = useState("whatsapp");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((t) => t.key === fromUrl)) setTab(fromUrl);
  }, []);

  const changeTab = (key) => {
    setTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="page">
      <PageHeader
        title="Configuration"
        description="How each brand and location sends WhatsApp messages and email."
      />

      {!canManage && <ReadOnlyNotice what="the configuration" />}

      <Tabs tabs={TABS} value={tab} onChange={changeTab} className="mb-4" />

      {tab === "whatsapp" && <MessagingSettings channel="whatsapp" />}
      {tab === "email" && <MessagingSettings channel="email" />}
    </div>
  );
}