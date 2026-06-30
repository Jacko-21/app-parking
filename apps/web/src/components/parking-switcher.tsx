"use client";

import { SquareParking } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type ParkingOption = {
  id: string;
  name: string;
};

type ParkingSwitcherProps = {
  parkings: ParkingOption[];
  currentParkingId: string;
};

export function ParkingSwitcher({ parkings, currentParkingId }: ParkingSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(parkingId: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("parking", parkingId);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-2 text-muted">
        <SquareParking aria-hidden="true" size={18} />
        Parking
      </span>
      <select
        className="h-10 min-w-[200px] rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink disabled:opacity-60"
        value={currentParkingId}
        disabled={isPending || parkings.length === 0}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
      >
        {parkings.map((parking) => (
          <option key={parking.id} value={parking.id}>
            {parking.name}
          </option>
        ))}
      </select>
    </label>
  );
}
