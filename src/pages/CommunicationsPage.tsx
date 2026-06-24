import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageRecipientPicker } from "@/components/communications/MessageRecipientPicker";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, type MessageRecipientApi } from "@/lib/api";

const categoryIcon: Record<string, string> = {
  booking: "CalendarCheck",
  payment: "CreditCard",
  service: "ConciergeBell",
  recommendation: "Sparkles",
  checkout: "LogOut",
};

export function CommunicationsPage() {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();
  const backend = useBackendData();
  const isGuest = user?.role === "guest";

  const [reply, setReply] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipients, setRecipients] = useState<MessageRecipientApi[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRecipientsLoading(true);
    void api
      .getMessageRecipients()
      .then((list) => {
        if (cancelled) return;
        setRecipients(list);
        if (!recipientEmail && list.length > 0) {
          const preferred = isGuest
            ? list.find((r) => r.role === "receptionist") ?? list[0]
            : list.find((r) => r.role === "guest") ?? list[0];
          setRecipientEmail(preferred.email);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : "Could not load users", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setRecipientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; default recipient set from first fetch
  }, [isGuest, showToast]);

  const staffInbox = useMemo(
    () =>
      backend.notifications.map((n) => ({
        id: n.id,
        from: n.category.charAt(0).toUpperCase() + n.category.slice(1),
        subject: n.title,
        body: n.body,
        time: n.time,
        unread: !n.read,
      })),
    [backend.notifications],
  );

  const sendReply = async () => {
    if (!reply.trim()) {
      showToast("Type a message first", "warning");
      return;
    }
    if (!recipientEmail.trim()) {
      showToast("Select who should receive this message", "warning");
      return;
    }
    try {
      await api.sendNotification({
        toEmail: recipientEmail.trim(),
        title: selected ? "Reply from communications" : "New message",
        body: reply.trim(),
        category: "system",
      });
      if (isGuest) await guest.refresh();
      else await backend.refresh();
      showToast("Message sent", "success");
      setReply("");
      if (selected) setSelected(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not send message", "error");
    }
  };

  const composeForm = (
    <>
      <MessageRecipientPicker
        recipients={recipients}
        value={recipientEmail}
        onChange={setRecipientEmail}
        loading={recipientsLoading}
      />
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        placeholder={
          isGuest
            ? "Type your message to the front desk..."
            : "Type your message to guest or staff..."
        }
        className="mt-3 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
      />
      <Button
        className="mt-3"
        icon={<Icon name="Send" className="h-4 w-4" />}
        disabled={recipientsLoading || !recipientEmail}
        onClick={() => void sendReply()}
      >
        Send message
      </Button>
    </>
  );

  if (isGuest) {
    const unread = guest.notifications.filter((n) => !n.read).length;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "Bell", label: "Total alerts", value: String(guest.notifications.length) },
            { icon: "Mail", label: "Unread", value: String(unread) },
            { icon: "MessageSquare", label: "Contacts", value: String(recipients.length) },
          ].map((s) => (
            <Card key={s.label} className="flex items-center gap-4 p-4">
              <Icon name={s.icon} className="h-8 w-8 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Your notifications"
              subtitle="Bookings, payments, services & checkout reminders"
              action={
                unread > 0 ? (
                  <Button size="sm" variant="outline" onClick={() => guest.markAllNotificationsRead()}>
                    Mark all read
                  </Button>
                ) : undefined
              }
            />
            {guest.notifications.length === 0 ? (
              <EmptyState
                icon="Bell"
                title="No notifications"
                description="Booking updates and service replies will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {guest.notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border p-3 ${
                      n.read
                        ? "border-[var(--border-subtle)]"
                        : "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3">
                        <Icon
                          name={categoryIcon[n.category] ?? "Bell"}
                          className="mt-0.5 h-4 w-4 text-[var(--accent)]"
                        />
                        <div>
                          <p className="font-medium">{n.title}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{n.body}</p>
                          <p className="text-xs text-[var(--text-muted)]">{n.time}</p>
                        </div>
                      </div>
                      {!n.read && <Badge variant="info">New</Badge>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => guest.markNotificationRead(n.id)}
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => guest.dismissNotification(n.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Send a message"
              subtitle="Choose who should receive your message from the hotel team"
            />
            {composeForm}
          </Card>
        </div>
      </div>
    );
  }

  const unreadStaff = staffInbox.filter((m) => m.unread).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: "Bell", label: "System alerts", value: String(backend.notifications.length) },
          { icon: "Mail", label: "Unread", value: String(unreadStaff) },
          { icon: "Users", label: "Contacts", value: String(recipients.length) },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-4">
            <Icon name={s.icon} className="h-8 w-8 text-[var(--accent)]" />
            <div>
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Inbox" subtitle="Notifications from bookings, payments & services" />
          {backend.loading ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading inbox…</p>
          ) : staffInbox.length === 0 ? (
            <EmptyState
              icon="Inbox"
              title="Inbox is clear"
              description="Guest and system notifications will appear here as activity occurs."
            />
          ) : (
            <ul className="space-y-2">
              {staffInbox.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                      m.unread
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                        : "border-[var(--border-subtle)]"
                    } ${selected === m.id ? "ring-2 ring-[var(--accent)]/30" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{m.from}</p>
                      {m.unread && <Badge variant="info">New</Badge>}
                    </div>
                    <p className="text-sm">{m.subject}</p>
                    <p className="line-clamp-1 text-xs text-[var(--text-muted)]">{m.body}</p>
                    <p className="text-xs text-[var(--text-muted)]">{m.time}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={selected ? "Reply" : "Compose"}
            subtitle="Select a user from the list and send your message"
          />
          {selected && (
            <p className="mb-3 rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              Replying to: {staffInbox.find((m) => m.id === selected)?.subject}
            </p>
          )}
          {composeForm}

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              Notification templates
            </p>
            <ul className="space-y-2 text-sm">
              {["Booking confirmation", "Check-in reminder", "Payment receipt", "Service completed"].map(
                (t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        setReply(`[${t}] `);
                        showToast(`Template "${t}" inserted`, "info");
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 transition-colors hover:bg-[var(--bg-muted)]"
                    >
                      {t}
                      <Icon name="ChevronRight" className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
