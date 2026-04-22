import { redirect } from "next/navigation";

export default function AssetPurchasesPage() {
  redirect("/asset-operations?tab=purchases");
}
