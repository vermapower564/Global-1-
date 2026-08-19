"use client";

import PublicFeedbackPage from "../../feedback/[token]/page";

export default function ReviewTokenAliasPage({ params }: { params: Promise<{ token: string }> }) {
  return <PublicFeedbackPage params={params} />;
}
