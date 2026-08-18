"use client";
import { useState } from "react";
export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
      "idle",
    ),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setMessage("");
    const form = e.currentTarget,
      data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (response.ok) {
      form.reset();
      setState("sent");
      setMessage(
        "Your message is with the STHENO team. We’ll reply to the email you provided.",
      );
    } else {
      setState("error");
      setMessage(body.error ?? "Something went wrong. Please try again.");
    }
  }
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-pair">
        <label>
          Name
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={160}
            required
          />
        </label>
      </div>
      <label>
        Reason
        <select name="category" defaultValue="membership">
          <option value="membership">Membership or billing</option>
          <option value="technical">Technical help</option>
          <option value="partnership">Partnership or press</option>
          <option value="privacy">Privacy or data request</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label>
        Subject
        <input name="subject" minLength={3} maxLength={120} required />
      </label>
      <label>
        Message
        <textarea
          name="message"
          rows={8}
          minLength={20}
          maxLength={4000}
          placeholder="Tell us what happened, what you expected, and how we can help."
          required
        />
      </label>
      <label className="contact-honey" aria-hidden="true">
        Website
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </label>
      <button className="button button-large" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message →"}
      </button>
      <p
        className={`contact-status ${state}`}
        role={state === "error" ? "alert" : "status"}
      >
        {message}
      </p>
    </form>
  );
}
