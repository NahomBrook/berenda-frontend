// frontend/src/app/search/page.tsx
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage({ searchParams }: { searchParams: any }) {
  return <SearchClient searchParams={searchParams} />;
}