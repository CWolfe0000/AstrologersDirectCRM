import { redirect } from "next/navigation";

/** Kept so that old links still work. */
export default function Moved() {
  redirect("/app/patterns");
}
