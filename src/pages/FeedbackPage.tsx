import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api, type FeedbackApi } from "@/lib/api";

const CATEGORIES = [
  { id: "complaint", label: "Complaint — bad service" },
  { id: "service", label: "Service issue" },
  { id: "staff", label: "Staff conduct" },
  { id: "room", label: "Room problem" },
  { id: "stay", label: "Overall stay" },
  { id: "other", label: "Other" },
] as const;

const RATING_FILTERS = ["all", "complaints", "5", "4", "3", "2", "1"] as const;

function Stars({ value, onChange, readonly = false }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <Icon
            name="Star"
            className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-[var(--border-default)]"}`}
          />
        </button>
      ))}
    </div>
  );
}

function ratingBadgeVariant(rating: number): "success" | "info" | "warning" | "danger" | "default" {
  if (rating >= 4) return "success";
  if (rating === 3) return "warning";
  return "danger";
}

export function FeedbackPage() {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();
  const isGuest = user?.role === "guest";
  const canViewAll = user?.role === "admin" || user?.role === "management" || user?.role === "receptionist";
  const canReply = canViewAll;

  const [items, setItems] = useState<FeedbackApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("complaint");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [ratingFilter, setRatingFilter] = useState<(typeof RATING_FILTERS)[number]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFeedback();
      setItems(data);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load feedback", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (isGuest && guest.room && guest.room !== "—") {
      setRoom(guest.room);
    }
  }, [isGuest, guest.room]);

  const filtered = useMemo(() => {
    if (ratingFilter === "all") return items;
    if (ratingFilter === "complaints") {
      return items.filter((f) => f.category === "complaint" || f.rating <= 2);
    }
    return items.filter((f) => f.rating === Number(ratingFilter));
  }, [items, ratingFilter]);

  const isComplaintMode = category === "complaint" || rating <= 2;

  const avgRating = useMemo(() => {
    if (items.length === 0) return null;
    const sum = items.reduce((s, f) => s + f.rating, 0);
    return (sum / items.length).toFixed(1);
  }, [items]);

  const handleSubmit = async () => {
    if (rating < 1) {
      showToast("Select a star rating", "warning");
      return;
    }
    if (message.trim().length < 10) {
      showToast("Please write at least 10 characters", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitFeedback({
        rating,
        category,
        subject: subject.trim() || undefined,
        room: room.trim() || undefined,
        message: message.trim(),
      });
      showToast(
        isComplaintMode
          ? "Complaint submitted — management will follow up with you"
          : "Thank you — your feedback was sent to management",
        "success",
      );
      setMessage("");
      setSubject("");
      await load();
      await guest.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not submit feedback", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (feedbackId: string) => {
    const message = (replyDrafts[feedbackId] ?? "").trim();
    if (message.length < 5) {
      showToast("Please write at least 5 characters in your reply", "warning");
      return;
    }
    setReplyingId(feedbackId);
    try {
      const updated = await api.replyToFeedback(feedbackId, message);
      setItems((prev) => prev.map((f) => (f.id === feedbackId ? updated : f)));
      setReplyDrafts((prev) => ({ ...prev, [feedbackId]: "" }));
      showToast("Reply sent to guest", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not send reply", "error");
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[var(--accent)]/20 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent)]/5">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Guest voice</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {isGuest ? "Feedback & complaints" : "Guest feedback & complaints"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              {isGuest
                ? "Share feedback or file a complaint if you received bad service. Management and reception are notified immediately."
                : "View guest feedback and complaints. Reception can reply directly — the guest is notified."}
            </p>
          </div>
          {canViewAll && items.length > 0 && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">Average rating</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{avgRating}</p>
              <p className="text-xs text-[var(--text-muted)]">{items.length} submission{items.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </Card>

      {isGuest && (
        <Card id="feedback-form" className="p-5 sm:p-6">
          <CardHeader
            title="Feedback & complaint form"
            subtitle="Bad service? Choose Complaint and rate 1–2 stars — we will follow up"
          />
          {isComplaintMode && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              You are filing a <strong>complaint</strong>. Describe what went wrong so reception and management can
              help you.
            </div>
          )}
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Overall rating</span>
                <div className="mt-2">
                  <Stars
                    value={rating}
                    onChange={(n) => {
                      setRating(n);
                      if (n <= 2) setCategory("complaint");
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">1–2 stars = complaint about bad service</p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number]["id"])}
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Room (optional)</span>
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Deluxe 205"
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Subject (optional)</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary"
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Your feedback</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Describe the problem — poor service, delays, room issues, staff behaviour…"
                className="mt-1 w-full resize-y rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Minimum 10 characters</p>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={handleSubmit} loading={submitting} icon={<Icon name="Send" className="h-4 w-4" />}>
              {isComplaintMode ? "Submit complaint" : "Submit feedback"}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <CardHeader
          title={isGuest ? "Your submitted feedback" : "All guest feedback"}
          subtitle={
            isGuest
              ? "Track what you have already shared with the hotel"
              : "Admin, manager, and reception can review these anytime"
          }
        />
        {canViewAll && (
          <div className="mt-4 flex flex-wrap gap-2">
            {RATING_FILTERS.map((r) => (
              <FilterChip
                key={r}
                label={
                  r === "all" ? "All" : r === "complaints" ? "Complaints only" : `${r} stars`
                }
                active={ratingFilter === r}
                onClick={() => setRatingFilter(r)}
              />
            ))}
          </div>
        )}
        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading feedback…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="MessageSquare"
              title="No feedback yet"
              description={
                isGuest
                  ? "Use the form above to share your experience with us."
                  : "Guest submissions will appear here when received."
              }
            />
          ) : (
            filtered.map((f) => (
              <article
                key={f.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{f.id}</span>
                      {canViewAll && (
                        <span className="text-sm text-[var(--text-secondary)]">· {f.guestName}</span>
                      )}
                      <Badge variant={ratingBadgeVariant(f.rating)}>{f.rating}/5</Badge>
                      <Badge variant={f.category === "complaint" || f.rating <= 2 ? "danger" : "info"}>
                        {f.category === "complaint" ? "complaint" : f.category}
                      </Badge>
                    </div>
                    {f.subject && (
                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{f.subject}</p>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{f.message}</p>
                  </div>
                  <Stars value={f.rating} readonly />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span>{f.createdAt}</span>
                  {f.room && <span>Room {f.room}</span>}
                  {canViewAll && f.guestEmail && <span>{f.guestEmail}</span>}
                </div>

                {f.staffReply && (
                  <div className="mt-4 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      Hotel reply{f.repliedByName ? ` · ${f.repliedByName}` : ""}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">{f.staffReply}</p>
                    {f.repliedAt && <p className="mt-2 text-xs text-[var(--text-muted)]">{f.repliedAt}</p>}
                  </div>
                )}

                {canReply && (
                  <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                    <label className="block">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        {f.staffReply ? "Update reply to guest" : "Reply to guest"}
                      </span>
                      <textarea
                        value={replyDrafts[f.id] ?? f.staffReply ?? ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                        }
                        rows={3}
                        placeholder="Write your response — the guest will receive a notification."
                        className="mt-1 w-full resize-y rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      />
                    </label>
                    <Button
                      className="mt-2"
                      size="sm"
                      loading={replyingId === f.id}
                      icon={<Icon name="Send" className="h-4 w-4" />}
                      onClick={() => void handleReply(f.id)}
                    >
                      {f.staffReply ? "Update reply" : "Send reply"}
                    </Button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
