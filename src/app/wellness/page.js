import WithNavbar from "../../components/layout/WithNavbar";
import { SeniorModels, WellnessSteps, ComingSoon } from "../../components/wellness/wellness";
import WellnessHub from "../../components/wellness/WellnessHub";

// Final order: purple banner + 2 original model cards, compact steps strip,
// adjusted Ayurveda + near-you clinics + breathwork, coming-soon pills last.
// All sections share one centred 1120px container.
export default function WellnessPage() {
  return (
    <WithNavbar>
      <SeniorModels />
      <WellnessSteps />
      <WellnessHub showHero={false} />
      <ComingSoon />
    </WithNavbar>
  );
}
