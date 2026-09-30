import WithNavbar from "../../components/layout/WithNavbar";
import ForecastPage from "../../components/forecast/ForecastPage";

export const metadata = { title: "Forecast" };

export default function Page() {
  return (
    <WithNavbar>
      <ForecastPage />
    </WithNavbar>
  );
}
