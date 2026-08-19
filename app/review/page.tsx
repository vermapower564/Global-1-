import PublicFeedbackPage from "../feedback/[token]/page";

export default function RootReviewAliasPage() {
  return <PublicFeedbackPage params={Promise.resolve({ token: "EMP-8595" })} />;
}
