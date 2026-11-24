"use client";

import { useActionState, useState } from "react";
import { saveWhereYouLive } from "@/app/actions";
import { Notice, Submit } from "@/components/forms";
import { PlacePicker, type Place } from "@/components/place-picker";

export function HomeForm({ initial }: { initial: Place | null }) {
  const [state, action] = useActionState(saveWhereYouLive, undefined);
  const [place, setPlace] = useState<Place | null>(initial);
  return (
    <form action={action} className="space-y-3">
      <PlacePicker value={place} onChange={setPlace} label="Where you live now" />
      <input type="hidden" name="place" value={place?.place ?? ""} />
      <input type="hidden" name="lat" value={place?.lat ?? ""} />
      <input type="hidden" name="lon" value={place?.lon ?? ""} />
      <input type="hidden" name="tz" value={place?.tz ?? ""} />
      <Notice state={state} />
      <Submit className="btn-ghost">Save place</Submit>
    </form>
  );
}
