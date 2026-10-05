import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <Container className="space-y-8 pt-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </Container>
  );
}
