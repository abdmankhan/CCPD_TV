import AnnouncementsWidget from "../components/widgets/Announcements";
import DrivesWidget from "../components/widgets/Drives";
import CompanySpotlightWidget from "../components/widgets/Spotlight";
import StatsWidget from "../components/widgets/Stats";

export const widgetRegistry = {
  announcements: {
    name: "Announcements",
    component: AnnouncementsWidget,
    minW: 4,
    minH: 2
  },
  drives: {
    name: "Today's Drives",
    component: DrivesWidget,
    minW: 4,
    minH: 2
  },
  company_spotlight: {
    name: "Company Spotlight",
    component: CompanySpotlightWidget,
    minW: 4,
    minH: 2
  },
  stats: {
    name: "Placement Stats",
    component: StatsWidget,
    minW: 4,
    minH: 2
  }
};
