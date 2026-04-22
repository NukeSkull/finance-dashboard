import { redirect } from "next/navigation";

export default function AssetSalesPage() {
  redirect("/asset-operations?tab=sales");
}
