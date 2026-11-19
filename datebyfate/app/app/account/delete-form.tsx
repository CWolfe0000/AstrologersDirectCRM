"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions";
import { Notice, Submit } from "@/components/forms";

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="label" htmlFor="confirm">Type DELETE to confirm</label>
      <input id="confirm" name="confirm" className="input max-w-xs" autoComplete="off" />
      <Notice state={state} />
      <Submit className="btn bg-rose-hover text-white hover:bg-rose">Delete my account</Submit>
    </form>
  );
}
