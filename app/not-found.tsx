import { redirect } from "next/navigation";

// Any URL that doesn't match a real route (or any explicit notFound()) bounces
// the visitor back to the home apex instead of showing a 404. Bonus: wrong
// easter-egg guesses just land on the homepage rather than revealing a dead end.
export default function NotFound() {
  redirect("/");
}
