import { LocateOff } from "lucide-react-native";
import { NegativeBanner } from "@/components/ui/notice";

export function NoGpsBanner() {
  return <NegativeBanner icon={LocateOff} title="No GPS. Your patrol is still running." caption="Tracking resumes when the signal returns." />;
}
