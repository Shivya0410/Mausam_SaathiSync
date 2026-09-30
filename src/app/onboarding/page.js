import WithNavbar from "../../components/layout/WithNavbar";
import OnboardingFlow from "../../components/onboarding/OnboardingFlow";

export const metadata = { title: "Set up" };

export default function OnboardingPage() {
  return (
    <WithNavbar>
      <OnboardingFlow />
    </WithNavbar>
  );
}
