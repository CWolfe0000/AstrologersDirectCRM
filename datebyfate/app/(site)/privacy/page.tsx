import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Privacy" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-9 text-2xl font-semibold">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-ink-2">{children}</p>;

/** A plain description of what the software does with data. The operator's legal details still need adding. */
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-14">
        <h1 className="text-4xl font-semibold sm:text-5xl">Privacy</h1>
        <P>This page describes what Datebyfate stores and why.</P>
        <H>What we store</H>
        <P>Your account: your first name, email address and a one-way hash of your password. Your birth date, time and place. For each person you add: the name or nickname you give them, their birth date, time and place, and anything you enter about the relationship.</P>
        <P>Birth details and names are encrypted in our database. They are used only to calculate the readings you see.</P>
        <H>The free reading</H>
        <P>If you use the free reading without an account, your birth details are sent to our server to calculate the chart and are not saved. They stay in your browser tab so that you don’t have to type them again if you sign up.</P>
        <H>Other people’s details</H>
        <P>The birth details of your partners belong to them too. Please use a nickname or initial. Only you can see the people you add. We never contact them and never show their details to anyone else.</P>
        <H>Payments</H>
        <P>Subscriptions are handled by Stripe. We store your Stripe customer number and the status of your subscription. We never see your card number.</P>
        <H>Cookies</H>
        <P>We set one cookie, which keeps you signed in. We do not use advertising or tracking cookies.</P>
        <H>Deleting your data</H>
        <P>You can delete any person from their page. Deleting your account, under Account, removes your details and everyone you added, and cancels your subscription.</P>
      </main>
    </>
  );
}
