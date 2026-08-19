import PublicFeedbackPage from "./[token]/page";

export default function RootFeedbackPage() {
  return <PublicFeedbackPage params={Promise.resolve({ token: "EMP-8595" })} />;
}
