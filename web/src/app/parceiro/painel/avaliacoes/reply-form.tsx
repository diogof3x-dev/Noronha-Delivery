"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { replyToRating } from "@/app/actions/rating-reply";

export function ReplyForm({ ratingId }: { ratingId: string }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        <MessageSquare className="h-3 w-3" />
        Responder
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await replyToRating(fd);
          if (res.ok) {
            toast.success("Resposta enviada");
            setOpen(false);
            setReply("");
          } else {
            toast.error(res.error);
          }
        })
      }
      className="mt-3 space-y-2"
    >
      <input type="hidden" name="rating_id" value={ratingId} />
      <Textarea
        name="reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Agradeça pelo feedback e explique o que vai melhorar..."
        rows={2}
        maxLength={600}
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || reply.length < 5}>
          {pending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Send className="mr-2 h-3 w-3" />
          )}
          Enviar resposta
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setReply("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
