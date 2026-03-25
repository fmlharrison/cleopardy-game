import { MarketingLayout } from "@/components/layout/MarketingLayout";

import { HostPageClient } from "./host-page-client";

export default function HostPage() {
  return (
    <MarketingLayout contentMaxWidth="wide">
      <HostPageClient />
    </MarketingLayout>
  );
}
