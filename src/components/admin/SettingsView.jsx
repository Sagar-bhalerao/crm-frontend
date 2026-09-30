"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Plus } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { brandService } from "@/services/admin";
import { Button, PageHeader, Tabs } from "@/components/ui";
import MailConfigsTab from "./MailConfigsTab";
import ReadOnlyNotice from "./ReadOnlyNotice";
import WhatsappConfigsTab from "./WhatsappConfigsTab";

const TABS = [
  { key: "whatsapp", label: <><MessageCircle size={15} />WhatsApp</> },
  { key: "mail", label: <><Mail size={15} />Mail</> },
];

const ADD_LABEL = { whatsapp: "Add WhatsApp configuration", mail: "Add mail configuration" };

/**
 * Configuration: how each brand and location sends WhatsApp messages and email.
 * The open tab is kept in the URL (?tab=mail) so a refresh or shared link lands on it.
 */
export default function SettingsView() {
  const { can } = useAuth();
  const canManage = can(P.SETTINGS_MANAGE);
  const [tab, setTab] = useState("whatsapp");
  const [creating, setCreating] = useState(null);
  const [brands, setBrands] = useState(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl && ADD_LABEL[fromUrl]) setTab(fromUrl);
  }, []);

  // Brands come from the Brands master, loaded once for the filters and the forms.
  useEffect(() => {
    let alive = true;
    brandService
      .listBrands({ pageSize: 100, sort: "name:asc" })
      .then((res) => alive && setBrands(res.items))
      .catch(() => alive && setBrands([]));
    return () => {
      alive = false;
    };
  }, []);

  const changeTab = (key) => {
    setTab(key);
    setCreating(null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState(null, "", url);
  };

  const tabProps = (key) => ({
    brands,
    creating: creating === key,
    onCreate: () => setCreating(key),
    onCreateClose: () => setCreating(null),
  });

  return (
    <div className="page">
      <PageHeader
        title="Configuration"
        description="How each brand and location sends WhatsApp messages and email."
        actions={
          canManage && (
            <Button variant="primary" icon={Plus} onClick={() => setCreating(tab)}>
              {ADD_LABEL[tab]}
            </Button>
          )
        }
      />

      {!canManage && <ReadOnlyNotice what="the configuration" />}

      <div className="mb-4">
        <Tabs tabs={TABS} value={tab} onChange={changeTab} />
      </div>

      {tab === "whatsapp" ? <WhatsappConfigsTab {...tabProps("whatsapp")} /> : <MailConfigsTab {...tabProps("mail")} />}
    </div>
  );
}
