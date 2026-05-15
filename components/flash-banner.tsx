import { AlertBanner } from "@/components/ui/alert-banner";
import { getFlashMessage } from "@/lib/flash";

export async function FlashBanner() {
  const flash = await getFlashMessage();

  if (!flash) {
    return null;
  }

  return <AlertBanner clearOnMount key={`${flash.type}-${flash.message}`} message={flash.message} persisted type={flash.type} />;
}
